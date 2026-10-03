package vn.edu.dut.connect.volunteer.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

import static vn.edu.dut.connect.volunteer.domain.CoordinationValues.*;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Entity
@Table(name = "volunteer_completions")
public class VolunteerCompletion {
    @Id
    private UUID id;
    @Column(nullable = false)
    private UUID campaignId;
    @Column(nullable = false)
    private Instant createdAt;
    @Column(nullable = false)
    private Instant updatedAt;
    @Version
    private Long version;

    public UUID id() {
        return id;
    }

    public UUID campaignId() {
        return campaignId;
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

    public void requireVersion(Long expected) {
        CoordinationValues.version(version, expected);
    }

    public void touch() {
        updatedAt = Instant.now();
    }

    @Column(nullable = false)
    private UUID userId;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CompletionStatus status;
    @Column(precision = 8, scale = 2)
    private BigDecimal verifiedHours;
    @Column(length = 1000)
    private String note;
    private UUID verifiedByUserId;
    private Instant verifiedAt;

    protected VolunteerCompletion() {
    }

    public VolunteerCompletion(UUID campaign, UUID user) {
        identifier(campaign, "campaignId");
        identifier(user, "userId");
        id = UUID.randomUUID();
        campaignId = campaign;
        userId = user;
        status = CompletionStatus.PENDING;
        createdAt = Instant.now();
        touch();
    }

    public void record(CompletionStatus next, BigDecimal hours, String note, UUID actor) {
        if (status == CompletionStatus.VERIFIED) state("Verified completion is terminal");
        if (next == null) invalid("status", "Choose completion status");
        if (status == CompletionStatus.COMPLETED && next == CompletionStatus.PENDING)
            state("Completion cannot return to Pending");
        if (hours != null) {
            try {
                hours = hours.setScale(2, RoundingMode.UNNECESSARY);
            } catch (ArithmeticException e) {
                invalid("verifiedHours", "Use at most two decimal places");
            }
            if (hours.signum() < 0 || hours.compareTo(new BigDecimal("999999.99")) > 0)
                invalid("verifiedHours", "Hours must be between 0 and 999999.99");
        }
        String n = text(note, "note", 1000, false);
        if (next == CompletionStatus.VERIFIED && (hours == null || actor == null))
            invalid("verifiedHours", "Verification requires hours and verifier");
        if (next == CompletionStatus.VERIFIED) {
            if (status == CompletionStatus.PENDING) status = CompletionStatus.COMPLETED;
            status = CompletionStatus.VERIFIED;
            verifiedByUserId = actor;
            verifiedAt = Instant.now();
        } else status = next;
        verifiedHours = hours;
        this.note = n;
        touch();
    }

    public UUID userId() {
        return userId;
    }

    public CompletionStatus status() {
        return status;
    }

    public BigDecimal verifiedHours() {
        return verifiedHours;
    }

    public String note() {
        return note;
    }

    public UUID verifiedByUserId() {
        return verifiedByUserId;
    }

    public Instant verifiedAt() {
        return verifiedAt;
    }
}
