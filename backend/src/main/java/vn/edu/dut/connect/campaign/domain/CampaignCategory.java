package vn.edu.dut.connect.campaign.domain;
import jakarta.persistence.*;
import java.util.UUID;
import java.time.Instant;
@Entity @Table(name="campaign_categories")
public class CampaignCategory {
    @Id private UUID id;
    @Column(nullable=false, length=120) private String name;
    @Column(nullable=false, length=140) private String slug;
    @Column(length=300) private String description;
    @Column(nullable=false) private boolean active;
    private Instant createdAt;
    private Instant updatedAt;
    @Version private Long version;
    protected CampaignCategory() {}
    public CampaignCategory(String name, String slug, String description) {
        id = UUID.randomUUID(); this.slug = slug; active = true; createdAt = Instant.now();
        edit(name, description, true);
    }
    public void edit(String name, String description, boolean active) {
        if (name != null && name.indexOf('\0') >= 0)
            throw new CampaignViolation("VALIDATION_ERROR", "Text cannot contain null characters", "name");
        if (description != null && description.indexOf('\0') >= 0)
            throw new CampaignViolation("VALIDATION_ERROR", "Text cannot contain null characters", "description");
        if (name == null || name.isBlank() || name.trim().length() > 120)
            throw new CampaignViolation("VALIDATION_ERROR", "Enter a category name of at most 120 characters", "name");
        if (description != null && description.length() > 300)
            throw new CampaignViolation("VALIDATION_ERROR", "Description must be at most 300 characters", "description");
        this.name = name.trim(); this.description = description == null || description.isBlank() ? null : description.trim();
        this.active = active; updatedAt = Instant.now();
    }
    public void requireVersion(long expected) {
        if (version != expected) throw new CampaignViolation("OPTIMISTIC_LOCK_CONFLICT", "Category changed. Reload and try again.");
    }
    public UUID id() { return id; }
    public String name() { return name; }
    public String slug() { return slug; }
    public String description() { return description; }
    public boolean active() { return active; }
    public Long version() { return version; }
}
