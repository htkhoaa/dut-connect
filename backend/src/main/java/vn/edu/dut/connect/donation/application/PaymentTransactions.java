package vn.edu.dut.connect.donation.application;

import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.campaign.application.CampaignAccessPort;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.identity.application.IdentityDirectoryPort;
import vn.edu.dut.connect.donation.domain.*;
import vn.edu.dut.connect.notification.application.NotificationService;
import vn.edu.dut.connect.notification.infrastructure.websocket.NotificationWebSocketHandler;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

import static vn.edu.dut.connect.donation.application.PaymentGateway.*;

@Service
public class PaymentTransactions {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(PaymentTransactions.class);
    private static final Duration ORDER_LIFETIME = Duration.ofMinutes(15);
    private final PaymentRepository repository;
    private final CampaignAccessPort campaigns;
    private final IdentityDirectoryPort identities;
    private final DonationPolicy policy;
    private final NotificationService notificationService;
    private final NotificationWebSocketHandler wsHandler;

    public PaymentTransactions(PaymentRepository repository, CampaignAccessPort campaigns, IdentityDirectoryPort identities, DonationPolicy policy, NotificationService notificationService, NotificationWebSocketHandler wsHandler) {
        this.repository = repository;
        this.campaigns = campaigns;
        this.identities = identities;
        this.policy = policy;
        this.notificationService = notificationService;
        this.wsHandler = wsHandler;
    }

    @Transactional
    public CreationCommand prepare(UUID campaign, UUID actor, BigDecimal supplied, String provider) {
        BigDecimal amount = Donation.integerAmount(supplied);
        if (amount.compareTo(policy.minimum()) < 0 || amount.compareTo(policy.maximum()) > 0)
            throw new PaymentViolation("VALIDATION_ERROR", "Amount is outside configured donation limits", "amount");
        var c = campaigns.lockCampaign(campaign);
        var account = identities.lockAccount(actor).orElseThrow(() -> ApplicationFailure.missing("Account not found"));
        if (!account.active()) throw new ApplicationFailure(403, "ACCESS_DENIED", "An active account is required");
        if (c.status() != CampaignStatus.OPEN && c.status() != CampaignStatus.ACTIVE || c.contributionMode() == ContributionMode.VOLUNTEER_ONLY || c.fundraisingDeadline() != null && !Instant.now().isBefore(c.fundraisingDeadline()))
            throw new ApplicationFailure(409, "CAMPAIGN_NOT_ACCEPTING_DONATIONS", "Campaign is not accepting donations");
        var d = repository.saveDonation(new Donation(campaign, actor, amount));
        Instant now = Instant.now();
        String order;
        if ("payos".equalsIgnoreCase(provider)) {
            long code = (System.currentTimeMillis() % 100_000_000_000L) * 100 + java.util.concurrent.ThreadLocalRandom.current().nextInt(100);
            order = String.valueOf(code);
        } else {
            order = DateTimeFormatter.ofPattern("yyMMdd").withZone(ZoneId.of("Asia/Ho_Chi_Minh")).format(now) + "_" + UUID.randomUUID().toString().replace("-", "");
        }
        var p = repository.savePayment(new PaymentTransaction(d.id(), provider, order, amount, now.plus(ORDER_LIFETIME)));
        log.info("Payment intent created actor={} campaign={} donation={} payment={}", actor, campaign, d.id(), p.id());
        return new CreationCommand(d.id(), p.id(), order, amount, now, p.expiresAt());
    }

    @Transactional
    public void finalizeCreation(UUID id, CreationResult result) {
        var d = lockDonation(id);
        var p = repository.lockPayment(id).orElseThrow();
        if (p.status() != PaymentStatus.CREATED) return;
        switch (result.outcome()) {
            case PENDING -> {
                p.created(result.checkoutUrl(), result.code());
                d.pending();
            }
            case FAILED -> {
                p.fail(result.code(), "Provider rejected order creation");
                d.fail();
            }
            case UNKNOWN -> p.unknown(result.code(), "Provider outcome is unresolved. Refresh payment status.");
            default -> throw new PaymentViolation("PAYMENT_PROVIDER_ERROR", "Unexpected order creation outcome", null);
        }
        repository.saveDonation(d);
        repository.savePayment(p);
        log.info("Payment creation recorded donation={} payment={} outcome={} status={}", d.id(), id, result.outcome(), p.status());
    }

    @Transactional
    public UUID settle(VerifiedResult result) {
        UUID id = repository.paymentByOrder(result.provider(), result.orderId()).orElseThrow(() -> ApplicationFailure.missing("Payment order not found"));
        var d = lockDonation(id);
        var p = repository.lockPayment(id).orElseThrow();
        boolean isNewlyPaid = false;
        if (result.outcome() == Outcome.PAID) {
            if (result.amount() == null || result.amount().compareTo(p.amount()) != 0 || p.amount().compareTo(d.amount()) != 0) {
                log.warn("Payment amount mismatch payment={} donation={}", id, d.id());
                throw new PaymentViolation("PAYMENT_AMOUNT_MISMATCH", "Provider amount does not match payment intent", null);
            }
            if (result.transactionId() == null || result.transactionId().isBlank())
                throw new PaymentViolation("PAYMENT_VERIFICATION_FAILED", "Provider transaction reference missing", null);
            if (p.status() == PaymentStatus.PAID) {
                if (!result.transactionId().equals(p.providerTransactionId()) || d.status() != DonationStatus.PAID)
                    throw new PaymentViolation("PAYMENT_VERIFICATION_FAILED", "Payment identity does not match settled transaction", null);
                return d.id();
            }
            p.paid(result.transactionId(), result.paidAt());
            d.paid();
            isNewlyPaid = true;
        } else if (p.status() != PaymentStatus.PAID && d.status() != DonationStatus.PAID) {
            if (result.outcome() == Outcome.FAILED) {
                p.fail(result.code(), "Provider confirmed payment failure");
                d.fail();
            } else if (result.outcome() == Outcome.CANCELLED) {
                p.cancel();
                d.cancel();
            } else return d.id();
        } else return d.id();
        repository.saveDonation(d);
        repository.savePayment(p);
        log.info("Payment settled donation={} payment={} status={}", d.id(), id, p.status());
        if (isNewlyPaid) {
            notifySettledDonation(d, p);
        }
        return d.id();
    }

    private void notifySettledDonation(Donation d, PaymentTransaction p) {
        try {
            var c = campaigns.getCampaign(d.campaignId());
            var donorAccount = identities.findAccount(d.donorUserId());
            String donorName = donorAccount.map(IdentityDirectoryPort.Account::fullName).orElse("Một nhà hảo tâm");

            java.text.NumberFormat nf = java.text.NumberFormat.getInstance(new java.util.Locale("vi", "VN"));
            String formattedAmount = nf.format(d.amount()) + " đ";

            // 1. Notify campaign primary contact and managers
            java.util.Set<UUID> recipients = new java.util.HashSet<>();
            if (c.ownerId() != null) {
                recipients.add(c.ownerId());
            }
            try {
                recipients.addAll(campaigns.managers(d.campaignId()));
            } catch (Exception e) {
                log.warn("Failed retrieving campaign managers for notification: {}", e.getMessage());
            }

            for (UUID managerId : recipients) {
                try {
                    notificationService.notifyUser(
                            managerId,
                            "DONATION_RECEIVED",
                            "Ủng hộ mới: " + formattedAmount,
                            donorName + " vừa ủng hộ " + formattedAmount + " cho chiến dịch '" + c.title() + "'.",
                            "CAMPAIGN",
                            d.campaignId()
                    );
                } catch (Exception e) {
                    log.warn("Failed sending notification to manager={}: {}", managerId, e.getMessage());
                }
            }

            // 2. Notify donor
            try {
                notificationService.notifyUser(
                        d.donorUserId(),
                        "DONATION_SUCCESS",
                        "Ủng hộ thành công!",
                        "Bạn đã ủng hộ thành công " + formattedAmount + " cho chiến dịch '" + c.title() + "'.",
                        "DONATION",
                        d.id()
                );
            } catch (Exception e) {
                log.warn("Failed sending notification to donor={}: {}", d.donorUserId(), e.getMessage());
            }

            // 3. Broadcast realtime update event to all connected clients
            java.util.Map<String, Object> event = new java.util.HashMap<>();
            event.put("action", "DONATION_RECEIVED");
            event.put("campaignId", d.campaignId().toString());
            event.put("donationId", d.id().toString());
            event.put("amount", d.amount().toPlainString());
            event.put("donorName", donorName);
            event.put("campaignTitle", c.title());
            wsHandler.broadcast(event);
            log.info("Settled donation notification broadcast for donation={} campaign={}", d.id(), d.campaignId());
        } catch (Exception e) {
            log.error("Failed to execute donation notifications for donation={}", d.id(), e);
        }
    }

    private Donation lockDonation(UUID payment) {
        UUID donation = repository.paymentDonation(payment).orElseThrow(() -> ApplicationFailure.missing("Payment not found"));
        return repository.lockDonation(donation).orElseThrow(() -> ApplicationFailure.missing("Donation not found"));
    }
}
