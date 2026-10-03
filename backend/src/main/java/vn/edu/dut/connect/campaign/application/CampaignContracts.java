package vn.edu.dut.connect.campaign.application;
import java.util.*;
import java.time.*;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.shared.application.PageResult;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
public final class CampaignContracts {
    private CampaignContracts() {}
    public record ContentDto(
        OrganizerType organizerType,
        UUID organizationId,
        UUID categoryId,
        String title,
        String summary,
        String description,
        String expectedImpact,
        ContributionMode contributionMode,
        LocalDate startDate,
        LocalDate endDate,
        Instant applicationDeadline,
        Instant fundraisingDeadline,
        Integer targetVolunteerCount,
        Integer targetTechnicalCount,
        Integer targetLogisticsCount,
        String volunteerRequirements,
        String fundraisingGoal,
        String institutionalFunding,
        String sponsorName,
        String sponsorFunding,
        String estimatedBudget
    ) {
        public static ContentDto from(CampaignContent c) {
            return new ContentDto(c.organizerType(), c.organizationId(), c.categoryId(), c.title(), c.summary(), c.description(), c.expectedImpact(), c.contributionMode(), c.startDate(), c.endDate(), c.applicationDeadline(), c.fundraisingDeadline(), c.targetVolunteerCount(), c.targetTechnicalCount(), c.targetLogisticsCount(), c.volunteerRequirements(), c.fundraisingGoal() == null ? null : c.fundraisingGoal().toPlainString(), c.institutionalFunding() == null ? null : c.institutionalFunding().toPlainString(), c.sponsorName(), c.sponsorFunding() == null ? null : c.sponsorFunding().toPlainString(), c.estimatedBudget() == null ? null : c.estimatedBudget().toPlainString());
        }
    }
    public record CreateRequest(@NotNull @Valid ContentInput content) {}
    public record PatchRequest(@NotNull @Valid ContentInput content, @Size(max=11) Set<@NotBlank String> clearFields, @NotNull @PositiveOrZero Long version) {}
    public record VersionRequest(@NotNull @PositiveOrZero Long version) {}
    public record RejectRequest(@NotBlank @Size(max=1000) String reason, @NotNull @PositiveOrZero Long version) {}
    public record CategoryRequest(@Size(max=120) String name, @Size(max=300) String description, Boolean active, boolean clearDescription, @PositiveOrZero Long version) {}
    public record CategoryDto(UUID id, String name, String slug, String description, boolean active, long version) {
        public static CategoryDto from(CampaignCategory c) { return new CategoryDto(c.id(),c.name(),c.slug(),c.description(),c.active(),c.version()); }
    }
    public record ProposalSummary(UUID id, String title, OrganizerType organizerType, ProposalStatus status, long version, Instant createdAt) {}
    public record ProposalDetail(UUID id, UUID proposerUserId, String proposerName, ContentDto content, String categoryName, String organizationName,
        ProposalStatus status, String rejectionReason, UUID reviewedByUserId, Instant reviewedAt, Instant createdAt, Instant updatedAt, long version, UUID campaignId, boolean canEdit) {}
    public record CampaignSummary(UUID id, String slug, String title, String summary, String organizerName, String categoryName, UUID categoryId, UUID organizationId,
        ContributionMode contributionMode, CampaignStatus status, LocalDate startDate, LocalDate endDate, Integer targetVolunteerCount, String fundraisingGoal, Instant createdAt, long version) {}
    public record CampaignDetail(UUID id, String slug, UUID proposalId, UUID primaryContactUserId, String primaryContactName, String organizerName, String categoryName,
        ContentDto content, CampaignStatus status, Instant createdAt, Instant updatedAt, long version, ManagerRole ownRole, boolean canManage, boolean canAssignManagers,
        List<SkillDto> skills) {}
    public record ManagerMembership(UUID userId, ManagerRole managerRole, Instant createdAt) {}
    public record ManagerDto(UUID userId, String studentId, String fullName, ManagerRole managerRole, Instant createdAt) {}
    public record AddManagerRequest(@NotBlank @Size(max=32) String studentId, @NotNull @PositiveOrZero Long version) {}
    public record Requirement(@NotNull UUID skillId, @NotNull SkillTrack track, @Min(1) @Max(5) Integer importance) {
        public Requirement { importance = importance == null ? 3 : importance; }
    }
    public record SkillDto(UUID skillId, String name, SkillTrack track, int importance) {}
    public record SkillsRequest(@NotNull @Size(max=100) List<@NotNull @Valid Requirement> items, @NotNull @PositiveOrZero Long version) {}
}
