package vn.edu.dut.connect.donation.application;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import org.springframework.stereotype.Service;
import vn.edu.dut.connect.identity.application.IdentityDirectoryPort;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

import static vn.edu.dut.connect.donation.application.DonationContracts.*;
import static vn.edu.dut.connect.donation.application.PaymentGateway.*;

@Service
public class PaymentService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(PaymentService.class);
    private final PaymentGateways gateways;
    private final PaymentTransactions transactions;
    private final DonationReadService reads;
    private final DonationPolicy policy;
    private final IdentityDirectoryPort identities;

    public PaymentService(PaymentGateways gateways, PaymentTransactions transactions, DonationReadService reads, DonationPolicy policy, IdentityDirectoryPort identities) {
        this.gateways = gateways;
        this.transactions = transactions;
        this.reads = reads;
        this.policy = policy;
        this.identities = identities;
    }

    public CreationDto create(UUID campaign, UUID actor, BigDecimal amount) {
        var gateway = gateways.selected();
        var command = transactions.prepare(campaign, actor, amount, gateway.provider());
        var result = gateway.createPayment(command);
        transactions.finalizeCreation(command.paymentId(), result);
        if (result.outcome() == PaymentGateway.Outcome.FAILED) {
            log.error("Payment gateway failed to create order: code={} message={}", result.code(), result.message());
            throw new ApplicationFailure(502, "PAYMENT_CREATION_FAILED", "Cổng thanh toán từ chối tạo đơn: " + result.message());
        }
        var d = reads.detail(command.donationId(), actor);
        var p = d.payments().stream().filter(v -> v.id().equals(command.paymentId())).findFirst().orElseThrow();

        String orderCode = command.orderId();
        String description = "DUT " + orderCode;

        String qrCodeUrl;
        if (result.qrCode() != null && !result.qrCode().isBlank() && !result.qrCode().startsWith("http")) {
            qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=350x350&data="
                    + URLEncoder.encode(result.qrCode(), StandardCharsets.UTF_8);
        } else if (result.qrCode() != null && result.qrCode().startsWith("http")) {
            qrCodeUrl = result.qrCode();
        } else {
            qrCodeUrl = "https://img.vietqr.io/image/MB-4310072005-compact2.png?amount="
                    + amount.toPlainString() + "&addInfo=" + URLEncoder.encode(description, StandardCharsets.UTF_8)
                    + "&accountName=HUYNH+TUAN+KHOA";
        }

        String bankName = "MB Bank";
        if ("970422".equals(result.bin())) bankName = "MB Bank";
        else if ("970415".equals(result.bin())) bankName = "VietinBank";
        else if ("970436".equals(result.bin())) bankName = "Vietcombank";
        else if ("970407".equals(result.bin())) bankName = "Techcombank";
        else if ("970418".equals(result.bin())) bankName = "BIDV";
        else if ("970432".equals(result.bin())) bankName = "VPBank";
        else if ("970416".equals(result.bin())) bankName = "ACB";
        else if ("970423".equals(result.bin())) bankName = "TPBank";
        else if ("970441".equals(result.bin())) bankName = "VIB";
        else if ("970405".equals(result.bin())) bankName = "Agribank";
        else if ("970448".equals(result.bin())) bankName = "OCB";
        else if ("970443".equals(result.bin())) bankName = "SHB";
        else if ("970403".equals(result.bin())) bankName = "Sacombank";
        else if (result.bin() != null && !result.bin().isBlank()) bankName = "Ngân hàng (BIN " + result.bin() + ")";

        String accountNumber = (result.accountNumber() != null && !result.accountNumber().isBlank())
                ? result.accountNumber() : "4310072005";
        String accountName = (result.accountName() != null && !result.accountName().isBlank())
                ? result.accountName() : "HUYNH TUAN KHOA";

        // A callback may settle the intent before the create-order response arrives.
        return new CreationDto(d.id(), p.id(), d.status(), p.checkoutUrl(), p.failureReason(), orderCode, qrCodeUrl, accountNumber, accountName, bankName);
    }

    public DonationDto checkAndDetail(UUID donationId, UUID actor) {
        var d = reads.detail(donationId, actor);
        if (d.status() == vn.edu.dut.connect.donation.domain.DonationStatus.CREATED
                || d.status() == vn.edu.dut.connect.donation.domain.DonationStatus.PENDING_PAYMENT) {
            for (var p : d.payments()) {
                if (p.status() == vn.edu.dut.connect.donation.domain.PaymentStatus.CREATED
                        || p.status() == vn.edu.dut.connect.donation.domain.PaymentStatus.PROVIDER_PENDING) {
                    try {
                        var result = gateways.get(p.provider()).query(p.providerOrderId());
                        if (result.outcome() == Outcome.PAID) {
                            transactions.settle(result);
                            return reads.detail(donationId, actor);
                        }
                    } catch (Exception e) {
                        log.debug("Auto-check query failed for order={}: {}", p.providerOrderId(), e.getMessage());
                    }
                }
            }
        }
        return d;
    }

    public DonationDto adminSettle(UUID donationId, UUID actor) {
        var account = identities.lockAccount(actor).orElseThrow(() -> ApplicationFailure.missing("Account not found"));
        if (!account.active() || !account.admin()) {
            throw new ApplicationFailure(403, "ACCESS_DENIED", "Admin access required");
        }
        var d = reads.detail(donationId, actor);
        if (d.status() == vn.edu.dut.connect.donation.domain.DonationStatus.PAID) {
            return d;
        }
        for (var p : d.payments()) {
            if (p.status() != vn.edu.dut.connect.donation.domain.PaymentStatus.PAID) {
                var verified = new VerifiedResult(
                        p.provider(),
                        p.providerOrderId(),
                        Outcome.PAID,
                        new BigDecimal(p.amount()),
                        "ADMIN_MANUAL_" + UUID.randomUUID().toString().substring(0, 8),
                        java.time.Instant.now(),
                        "00"
                );
                transactions.settle(verified);
                return reads.detail(donationId, actor);
            }
        }
        return d;
    }

    public DonationDto refresh(UUID id, UUID actor) {
        var p = reads.payment(id, actor);
        if (p.status() == vn.edu.dut.connect.donation.domain.PaymentStatus.CREATED || p.status() == vn.edu.dut.connect.donation.domain.PaymentStatus.PROVIDER_PENDING)
            transactions.settle(gateways.get(p.provider()).query(p.providerOrderId()));
        return reads.detail(reads.donationForPayment(id, actor), actor);
    }

    public void callback(String provider, Callback callback) {
        transactions.settle(gateways.get(provider).verifyCallback(callback));
    }

    public SettingsDto settings() {
        boolean available;
        try {
            gateways.selected();
            available = true;
        } catch (vn.edu.dut.connect.shared.application.ApplicationFailure e) {
            available = false;
        }
        return new SettingsDto(policy.provider(), policy.minimum().toPlainString(), policy.maximum().toPlainString(), available);
    }
}
