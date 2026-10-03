package vn.edu.dut.connect.campaign.domain;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="proposals")
public class Proposal {
    @Id private UUID id;
    @Embedded private CampaignContent content;
    @Column(nullable=false) private UUID proposerUserId;
    @Column(length=1000) private String rejectionReason;
    private UUID reviewedByUserId;
    private Instant reviewedAt;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20) private ProposalStatus status;
    @Column(nullable=false) private Instant createdAt;
    @Column(nullable=false) private Instant updatedAt;
    @Version private Long version;
    protected Proposal() {}
    public Proposal(UUID proposer, CampaignContent content) {
        id = UUID.randomUUID();
        proposerUserId = proposer;
        this.content = content;
        status = ProposalStatus.PENDING;
        createdAt = Instant.now(); updatedAt = createdAt;
    }
    public void edit(CampaignContent content) {
        requirePending();
        this.content = content; touch();
    }
    public void requirePending() {
        if (status != ProposalStatus.PENDING) throw new CampaignViolation("INVALID_STATE_TRANSITION", "Only pending proposals can be changed or reviewed");
    }
    public void approve(UUID actor) { requirePending(); status = ProposalStatus.APPROVED; review(actor); }
    public void reject(UUID actor, String reason) {
        requirePending();
        if (reason != null && reason.indexOf('\0') >= 0)
            throw new CampaignViolation("VALIDATION_ERROR", "Text cannot contain null characters", "reason");
        if (reason == null || reason.isBlank() || reason.trim().length() > 1000) throw new CampaignViolation("VALIDATION_ERROR", "A rejection reason of at most 1000 characters is required", "reason");
        rejectionReason = reason.trim(); status = ProposalStatus.REJECTED; review(actor);
    }
    private void review(UUID actor) { reviewedByUserId = actor; reviewedAt = Instant.now(); touch(); }
    public UUID proposerId() { return proposerUserId; }
    public String rejectionReason() { return rejectionReason; }
    public UUID reviewerId() { return reviewedByUserId; }
    public Instant reviewedAt() { return reviewedAt; }
    public void requireVersion(long expected) {
        if (version != expected) throw new CampaignViolation("OPTIMISTIC_LOCK_CONFLICT", "This record changed. Reload and try again.");
    }
    public void touch() { updatedAt = Instant.now(); }
    public UUID id() { return id; }
    public CampaignContent content() { return content; }
    public ProposalStatus status() { return status; }
    public Long version() { return version; }
    public Instant createdAt() { return createdAt; }
    public Instant updatedAt() { return updatedAt; }
}
