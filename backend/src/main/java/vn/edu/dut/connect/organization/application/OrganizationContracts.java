package vn.edu.dut.connect.organization.application;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.UUID;
import vn.edu.dut.connect.organization.domain.*;
public final class OrganizationContracts {
    private OrganizationContracts() {
    }
    public record TypeSummary(UUID id, String code, String name, boolean active) {
    }
    public record Summary(UUID id, String name, String slug, UUID organizationTypeId, String organizationTypeName,
    OrganizationStatus status, long version, Instant createdAt, String description) {
    }
    public record Detail(Summary organization, String description, UUID createdByUserId, UUID verifiedByUserId,
    Instant verifiedAt, Instant updatedAt, MemberRole ownRole, boolean canEdit,
    boolean canManageMembers, boolean canRepresent) {
    }
    public record Member(UUID userId, String studentId, String fullName, MemberRole memberRole, Instant joinedAt) {
    }
    public record CreateRequest(@NotBlank @Size(max=200) String name, @NotNull UUID organizationTypeId,
    @Size(max=10000) String description) {
    }
    public record PatchRequest(@Size(min=1, max=200) String name, UUID organizationTypeId,
    @Size(max=10000) String description, boolean clearDescription,
    @NotNull @PositiveOrZero Long version) {
    }
    public record VersionRequest(@NotNull @PositiveOrZero Long version) {
    }
    public record AddMemberRequest(@NotBlank @Size(max=32) String studentId, @NotNull MemberRole memberRole,
    @NotNull @PositiveOrZero Long version) {
    }
    public record RoleRequest(@NotNull MemberRole memberRole, @NotNull @PositiveOrZero Long version) {
    }
    public record TransferRequest(@NotNull UUID userId, @NotNull @PositiveOrZero Long version) {
    }
    public record MemberAdded(Member member, long organizationVersion) {
    }
}
