package vn.edu.dut.connect.donation.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payment_transactions")
public class PaymentTransaction {
    @Id
    private UUID id;
    @Column(nullable = false)
    private UUID donationId;
    @Column(nullable = false, length = 30)
    private String provider;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentStatus status;
    @Column(nullable = false, length = 100, unique = true)
    private String providerOrderId;
    @Column(length = 100, unique = true)
    private String providerTransactionId;
    @Column(nullable = false, precision = 19, scale = 0)
    private BigDecimal amount;
    @Column(length = 2000)
    private String checkoutUrl;
    @Column(length = 100)
    private String providerResponseCode;
    @Column(length = 1000)
    private String failureReason;
    private Instant expiresAt;
    private Instant paidAt;
    @Column(nullable = false)
    private Instant createdAt;
    @Column(nullable = false)
    private Instant updatedAt;
    @Version
    private Long version;

    protected PaymentTransaction() {
    }

    public PaymentTransaction(UUID donation, String provider, String order, BigDecimal amount, Instant expires) {
        id = UUID.randomUUID();
        donationId = donation;
        this.provider = provider;
        providerOrderId = order;
        this.amount = Donation.integerAmount(amount);
        expiresAt = expires;
        status = PaymentStatus.CREATED;
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    public void created(String url, String code) {
        if (status != PaymentStatus.CREATED) return;
        if (url == null || url.isBlank() || url.length() > 2000)
            throw new PaymentViolation("PAYMENT_PROVIDER_ERROR", "Provider returned an invalid checkout URL", null);
        checkoutUrl = url;
        providerResponseCode = code;
        change(PaymentStatus.PROVIDER_PENDING);
    }

    public void unknown(String code, String reason) {
        if (status == PaymentStatus.CREATED) {
            providerResponseCode = code;
            failureReason = reason;
            updatedAt = Instant.now();
        }
    }

    public void paid(String transaction, Instant time) {
        if (transaction == null || transaction.isBlank() || transaction.length() > 100)
            throw new PaymentViolation("PAYMENT_VERIFICATION_FAILED", "Provider transaction reference required", null);
        if (status == PaymentStatus.PAID) return;
        if (status == PaymentStatus.CREATED) change(PaymentStatus.PROVIDER_PENDING);
        if (status != PaymentStatus.PROVIDER_PENDING) invalid();
        providerTransactionId = transaction;
        paidAt = time == null ? Instant.now() : time;
        failureReason = null;
        change(PaymentStatus.PAID);
    }

    public void fail(String code, String reason) {
        if (status == PaymentStatus.FAILED) return;
        if (status != PaymentStatus.CREATED && status != PaymentStatus.PROVIDER_PENDING) invalid();
        providerResponseCode = code;
        failureReason = reason;
        change(PaymentStatus.FAILED);
    }

    public void cancel() {
        if (status == PaymentStatus.CANCELLED) return;
        if (status != PaymentStatus.PROVIDER_PENDING) invalid();
        change(PaymentStatus.CANCELLED);
    }

    private void invalid() {
        throw new PaymentViolation("INVALID_STATE_TRANSITION", "Payment cannot perform this transition", null);
    }

    private void change(PaymentStatus next) {
        status = next;
        updatedAt = Instant.now();
    }

    public UUID id() {
        return id;
    }

    public UUID donationId() {
        return donationId;
    }

    public String provider() {
        return provider;
    }

    public PaymentStatus status() {
        return status;
    }

    public String providerOrderId() {
        return providerOrderId;
    }

    public String providerTransactionId() {
        return providerTransactionId;
    }

    public BigDecimal amount() {
        return amount;
    }

    public String checkoutUrl() {
        return checkoutUrl;
    }

    public String providerResponseCode() {
        return providerResponseCode;
    }

    public String failureReason() {
        return failureReason;
    }

    public Instant expiresAt() {
        return expiresAt;
    }

    public Instant paidAt() {
        return paidAt;
    }

    public Instant createdAt() {
        return createdAt;
    }

    public Instant updatedAt() {
        return updatedAt;
    }

    public Long version() {
        return version;
    }
}
