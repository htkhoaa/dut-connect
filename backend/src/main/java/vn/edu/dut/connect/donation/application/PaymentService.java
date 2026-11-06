package vn.edu.dut.connect.donation.application;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import org.springframework.stereotype.Service;

import static vn.edu.dut.connect.donation.application.DonationContracts.*;
import static vn.edu.dut.connect.donation.application.PaymentGateway.*;

@Service
public class PaymentService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(PaymentService.class);
    private final PaymentGateways gateways;
    private final PaymentTransactions transactions;
    private final DonationReadService reads;
    private final DonationPolicy policy;

    public PaymentService(PaymentGateways gateways, PaymentTransactions transactions, DonationReadService reads, DonationPolicy policy) {
        this.gateways = gateways;
        this.transactions = transactions;
        this.reads = reads;
        this.policy = policy;
    }

    public CreationDto create(UUID campaign, UUID actor, BigDecimal amount) {
        var gateway = gateways.selected();
        var command = transactions.prepare(campaign, actor, amount, gateway.provider());
        var result = gateway.createPayment(command);
        transactions.finalizeCreation(command.paymentId(), result);
        var d = reads.detail(command.donationId(), actor);
        var p = d.payments().stream().filter(v -> v.id().equals(command.paymentId())).findFirst().orElseThrow();

        String orderCode = command.orderId();
        String description = "DUT " + orderCode;
        String qrCodeUrl = "https://img.vietqr.io/image/MB-4310072005-compact2.png?amount="
                + amount.toPlainString() + "&addInfo=" + URLEncoder.encode(description, StandardCharsets.UTF_8)
                + "&accountName=HUYNH+TUAN+KHOA";

        // A callback may settle the intent before the create-order response arrives.
        return new CreationDto(d.id(), p.id(), d.status(), p.checkoutUrl(), p.failureReason(), orderCode, qrCodeUrl);
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
