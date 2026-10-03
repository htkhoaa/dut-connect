package vn.edu.dut.connect.organization.application;
import java.util.*;
import vn.edu.dut.connect.organization.domain.*;
import vn.edu.dut.connect.shared.application.PageResult;
import static vn.edu.dut.connect.organization.application.OrganizationContracts.*;
public interface OrganizationRepository {
    Optional<Organization> find(UUID id);
    Map<UUID, String> names(Set<UUID> ids);
    Optional<Organization> lock(UUID id);
    Organization save(Organization organization);
    void lockSlugAllocation(String base);
    boolean slugExists(String slug);
    Optional<TypeSummary> type(UUID id);
    PageResult<TypeSummary> types(OrganizationQuery query);
    PageResult<Summary> browse(OrganizationQuery query, OrganizationStatus status, UUID memberId);
    Optional<MemberRole> role(UUID organizationId, UUID userId);
    long ownerCount(UUID organizationId);
    PageResult<OrganizationMembership> members(UUID organizationId, OrganizationQuery query);
    Optional<OrganizationMembership> member(UUID organizationId, UUID userId);
    void addMember(UUID organizationId, UUID userId, MemberRole role);
    void changeRole(UUID organizationId, UUID userId, MemberRole role);
    void removeMember(UUID organizationId, UUID userId);
}
