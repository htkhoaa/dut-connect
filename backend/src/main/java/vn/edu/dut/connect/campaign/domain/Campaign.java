package vn.edu.dut.connect.campaign.domain;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="campaigns")
public class Campaign {
    @Id private UUID id;
    @Embedded private CampaignContent content;
    @Column(nullable=false) private UUID proposalId;
    @Column(nullable=false, length=240) private String slug;
    @Column(nullable=false) private UUID primaryContactUserId;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20) private CampaignStatus status;
    @Column(nullable=false) private Instant createdAt;
    @Column(nullable=false) private Instant updatedAt;
    @Version private Long version;
    protected Campaign() {}
    public Campaign(Proposal proposal, String slug) {
        if (proposal.status() != ProposalStatus.APPROVED)
            throw new CampaignViolation("INVALID_STATE_TRANSITION", "Only an approved proposal can create a campaign");
        id = UUID.randomUUID();
        proposalId = proposal.id();
        primaryContactUserId = proposal.proposerId();
        this.content = new CampaignContent(proposal.content().values());
        this.slug = slug;
        status = CampaignStatus.DRAFT;
        createdAt = Instant.now(); updatedAt = createdAt;
    }
    public void edit(CampaignContent content) {
        requireMutable();
        if (content.organizerType() != this.content.organizerType() || !java.util.Objects.equals(content.organizationId(), this.content.organizationId()))
            throw new CampaignViolation("VALIDATION_ERROR", "Campaign ownership cannot change", "organizerType");
        if (status != CampaignStatus.DRAFT && content.contributionMode() != this.content.contributionMode())
            throw new CampaignViolation("VALIDATION_ERROR", "Contribution mode can change only in Draft", "contributionMode");
        this.content = content; touch();
    }
    public void requireMutable() {
        if (status == CampaignStatus.COMPLETED || status == CampaignStatus.CANCELLED)
            throw new CampaignViolation("INVALID_STATE_TRANSITION", "Completed and cancelled campaigns cannot be changed");
    }
    public void transition(CampaignStatus next) {
        boolean allowed = switch (status) {
            case DRAFT -> next == CampaignStatus.OPEN || next == CampaignStatus.CANCELLED;
            case OPEN -> next == CampaignStatus.ACTIVE || next == CampaignStatus.CANCELLED;
            case ACTIVE -> next == CampaignStatus.COMPLETED || next == CampaignStatus.CANCELLED;
            default -> false;
        };
        if (!allowed) throw new CampaignViolation("INVALID_STATE_TRANSITION", "Campaign cannot perform this transition");
        status = next; touch();
    }
    public UUID proposalId() { return proposalId; }
    public UUID contactId() { return primaryContactUserId; }
    public String slug() { return slug; }
    public void requireVersion(long expected) {
        if (version != expected) throw new CampaignViolation("OPTIMISTIC_LOCK_CONFLICT", "This record changed. Reload and try again.");
    }
    public void touch() { updatedAt = Instant.now(); }
    public UUID id() { return id; }
    public CampaignContent content() { return content; }
    public CampaignStatus status() { return status; }
    public Long version() { return version; }
    public Instant createdAt() { return createdAt; }
    public Instant updatedAt() { return updatedAt; }
}
