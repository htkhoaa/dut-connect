package vn.edu.dut.connect.donation.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "donations")
public class Donation {
    @Id
    private UUID id;
    @Column(nullable = false)
    private UUID campaignId;
    @Column(nullable = false)
    private UUID donorUserId;
    @Column(nullable = false, precision = 19, scale = 0)
    private BigDecimal amount;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DonationStatus status;
    @Column(nullable = false)
    private Instant createdAt;
    @Column(nullable = false)
    private Instant updatedAt;
    @Version
    private Long version;

    protected Donation() {
    }

    public Donation(UUID campaign, UUID donor, BigDecimal amount) {
        this.amount = integerAmount(amount);
        id = UUID.randomUUID();
        campaignId = campaign;
        donorUserId = donor;
        status = DonationStatus.CREATED;
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    public static BigDecimal integerAmount(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0 || amount.compareTo(new BigDecimal("9999999999999999999")) > 0)
            throw new PaymentViolation("VALIDATION_ERROR", "Enter a positive integer VND amount", "amount");
        try {
            return amount.setScale(0, RoundingMode.UNNECESSARY);
        } catch (ArithmeticException e) {
            throw new PaymentViolation("VALIDATION_ERROR", "Use whole VND amounts", "amount");
        }
    }

    public void pending() {
        if (status == DonationStatus.CREATED) change(DonationStatus.PENDING_PAYMENT);
    }

    public void paid() {
        if (status == DonationStatus.PAID) return;
        pending();
        require(DonationStatus.PENDING_PAYMENT);
        change(DonationStatus.PAID);
    }

    public void fail() {
        if (status == DonationStatus.FAILED) return;
        if (status != DonationStatus.CREATED && status != DonationStatus.PENDING_PAYMENT) invalid();
        change(DonationStatus.FAILED);
    }

    public void cancel() {
        if (status == DonationStatus.CANCELLED) return;
        require(DonationStatus.PENDING_PAYMENT);
        change(DonationStatus.CANCELLED);
    }

    private void require(DonationStatus expected) {
        if (status != expected) invalid();
    }

    private void invalid() {
        throw new PaymentViolation("INVALID_STATE_TRANSITION", "Donation cannot perform this transition", null);
    }

    private void change(DonationStatus next) {
        status = next;
        updatedAt = Instant.now();
    }

    public UUID id() {
        return id;
    }

    public UUID campaignId() {
        return campaignId;
    }

    public UUID donorUserId() {
        return donorUserId;
    }

    public BigDecimal amount() {
        return amount;
    }

    public DonationStatus status() {
        return status;
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
