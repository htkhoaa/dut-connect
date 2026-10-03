package vn.edu.dut.connect.organization.domain;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
@Entity
@Table(name="organizations")
public class Organization {
    @Id private UUID id;
    @Column(nullable=false, length=200) private String name;
    @Column(nullable=false, length=220) private String slug;
    @Column(nullable=false) private UUID organizationTypeId;
    private String description;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=30) private OrganizationStatus status;
    @Column(nullable=false) private UUID createdByUserId;
    private UUID verifiedByUserId;
    private Instant verifiedAt;
    @Column(nullable=false) private Instant createdAt;
    @Column(nullable=false) private Instant updatedAt;
    @Version private Long version;
    protected Organization() {
    }
    public Organization(String name, String slug, UUID type, String description, UUID creator) {
        id=UUID.randomUUID();
        this.name=name;
        this.slug=slug;
        organizationTypeId=type;
        this.description=description;
        createdByUserId=creator;
        status=OrganizationStatus.PENDING_VERIFICATION;
        createdAt=Instant.now();
        updatedAt=createdAt;
    }
    public void edit(String name, UUID type, String description) {
        this.name=name;
        organizationTypeId=type;
        this.description=description;
        touch();
    }
    public void verify(UUID actor) {
        transition(OrganizationStatus.PENDING_VERIFICATION, OrganizationStatus.VERIFIED);
        recordVerification(actor);
    }
    public void suspend() {
        transition(OrganizationStatus.VERIFIED, OrganizationStatus.SUSPENDED);
    }
    public void restore(UUID actor) {
        transition(OrganizationStatus.SUSPENDED, OrganizationStatus.VERIFIED);
        recordVerification(actor);
    }
    private void transition(OrganizationStatus expected, OrganizationStatus next) {
        if (status!=expected) throw new OrganizationRuleViolation("INVALID_STATE_TRANSITION", "Organization cannot perform this transition from its current status");
        status=next;
        touch();
    }
    private void recordVerification(UUID actor) {
        verifiedByUserId=actor;
        verifiedAt=Instant.now();
    }
    public void requireOwnerRemoval(MemberRole role, long ownerCount) {
        if (role==MemberRole.OWNER && ownerCount<=1)
            throw new OrganizationRuleViolation("CONFLICT", "Transfer ownership before removing or demoting the final owner");
    }
    public void touch() {
        updatedAt=Instant.now();
    }
    public UUID id() {
        return id;
    }
    public String name() {
        return name;
    }
    public String slug() {
        return slug;
    }
    public UUID typeId() {
        return organizationTypeId;
    }
    public String description() {
        return description;
    }
    public OrganizationStatus status() {
        return status;
    }
    public UUID creatorId() {
        return createdByUserId;
    }
    public UUID verifierId() {
        return verifiedByUserId;
    }
    public Instant verifiedAt() {
        return verifiedAt;
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
