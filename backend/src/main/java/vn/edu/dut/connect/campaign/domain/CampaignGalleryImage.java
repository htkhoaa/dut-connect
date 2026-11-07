package vn.edu.dut.connect.campaign.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "campaign_gallery", schema = "dut_connect")
public class CampaignGalleryImage {
    @Id
    private UUID id;
    private UUID campaignId;
    private UUID proposalId;
    @Column(columnDefinition = "bytea", nullable = false)
    private byte[] imageData;
    @Column(nullable = false, length = 100)
    private String contentType;
    @Column(length = 300)
    private String caption;
    private int sortOrder;
    @Column(nullable = false)
    private Instant createdAt;
    private UUID createdBy;

    protected CampaignGalleryImage() {}

    public CampaignGalleryImage(UUID campaignId, UUID proposalId, byte[] imageData, String contentType, String caption, int sortOrder, UUID createdBy) {
        this.id = UUID.randomUUID();
        this.campaignId = campaignId;
        this.proposalId = proposalId;
        this.imageData = imageData;
        this.contentType = contentType;
        this.caption = caption;
        this.sortOrder = sortOrder;
        this.createdAt = Instant.now();
        this.createdBy = createdBy;
    }

    public CampaignGalleryImage(UUID campaignId, byte[] imageData, String contentType, String caption, int sortOrder, UUID createdBy) {
        this(campaignId, null, imageData, contentType, caption, sortOrder, createdBy);
    }

    public UUID getId() { return id; }
    public UUID getCampaignId() { return campaignId; }
    public void setCampaignId(UUID campaignId) { this.campaignId = campaignId; }
    public UUID getProposalId() { return proposalId; }
    public void setProposalId(UUID proposalId) { this.proposalId = proposalId; }
    public byte[] getImageData() { return imageData; }
    public String getContentType() { return contentType; }
    public String getCaption() { return caption; }
    public int getSortOrder() { return sortOrder; }
    public Instant getCreatedAt() { return createdAt; }
    public UUID getCreatedBy() { return createdBy; }
}
