package vn.edu.dut.connect.organization.application;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.identity.application.IdentityDirectoryPort;
import vn.edu.dut.connect.organization.domain.*;
import vn.edu.dut.connect.shared.application.*;
import static vn.edu.dut.connect.organization.application.OrganizationContracts.*;
@Service
public class OrganizationMembershipService {
    private static final Logger log=LoggerFactory.getLogger(OrganizationMembershipService.class);
    private final OrganizationRepository organizations;
    private final OrganizationService service;
    private final OrganizationAuthorization access;
    private final IdentityDirectoryPort identities;
    public OrganizationMembershipService(OrganizationRepository organizations, OrganizationService service,
    OrganizationAuthorization access, IdentityDirectoryPort identities) {
        this.organizations=organizations;
        this.service=service;
        this.access=access;
        this.identities=identities;
    }
    @Transactional(readOnly=true)
    public PageResult<Member> list(UUID id, UUID actor, OrganizationQuery query) {
        organizations.find(id).orElseThrow(()->ApplicationFailure.missing("Organization not found"));
        access.memberOrAdmin(id, actor);
        var members=organizations.members(id, query);
        var accounts=identities.findAccounts(members.items().stream().map(OrganizationMembership::userId).collect(Collectors.toSet()));
        return members.map(member -> memberSummary(member, accounts.get(member.userId())));
    }
    @Transactional
    public MemberAdded add(UUID id, UUID actor, AddMemberRequest request) {
        Organization organization=service.locked(id);
        access.owner(id, actor);
        service.requireVersion(organization, request.version());
        grantable(request.memberRole());
        var target=identities.findStudent(request.studentId().trim().toUpperCase(Locale.ROOT))
        .orElseThrow(()->ApplicationFailure.missing("Student not found"));
        if (organizations.role(id, target.id()).isPresent()) throw ApplicationFailure.conflict("User is already an organization member");
        organizations.addMember(id, target.id(), request.memberRole());
        changed(organization, actor, target.id(), request.memberRole());
        return new MemberAdded(memberSummary(organizations.member(id, target.id()).orElseThrow(), target), organization.version());
    }
    @Transactional
    public Detail change(UUID id, UUID actor, UUID user, RoleRequest request) {
        Organization organization=service.locked(id);
        access.owner(id, actor);
        service.requireVersion(organization, request.version());
        grantable(request.memberRole());
        MemberRole previous=organizations.role(id, user).orElseThrow(()->ApplicationFailure.missing("Member not found"));
        organization.requireOwnerRemoval(previous, organizations.ownerCount(id));
        organizations.changeRole(id, user, request.memberRole());
        changed(organization, actor, user, request.memberRole());
        return service.detail(organization, actor);
    }
    @Transactional
    public void remove(UUID id, UUID actor, UUID user, long version) {
        Organization organization=service.locked(id);
        access.owner(id, actor);
        service.requireVersion(organization, version);
        MemberRole role=organizations.role(id, user).orElseThrow(()->ApplicationFailure.missing("Member not found"));
        organization.requireOwnerRemoval(role, organizations.ownerCount(id));
        organizations.removeMember(id, user);
        changed(organization, actor, user, null);
    }
    @Transactional
    public Detail transfer(UUID id, UUID actor, TransferRequest request) {
        Organization organization=service.locked(id);
        access.owner(id, actor);
        service.requireVersion(organization, request.version());
        if (actor.equals(request.userId())) throw new ApplicationFailure(400, "VALIDATION_ERROR", "Choose another member");
        MemberRole target=organizations.role(id, request.userId()).orElseThrow(()->ApplicationFailure.missing("Recipient must already be an organization member"));
        if (target==MemberRole.OWNER) throw ApplicationFailure.conflict("Recipient is already an owner");
        access.active(request.userId());
        organizations.changeRole(id, request.userId(), MemberRole.OWNER);
        organizations.changeRole(id, actor, MemberRole.MANAGER);
        changed(organization, actor, request.userId(), MemberRole.OWNER);
        return service.detail(organization, actor);
    }
    private void changed(Organization organization, UUID actor, UUID user, MemberRole role) {
        organization.touch();
        organizations.save(organization);
        log.info("Organization membership changed actor={} organization={} user={} role={}", actor, organization.id(), user, role);
    }
    private static void grantable(MemberRole role) {
        if (role==MemberRole.OWNER) throw new ApplicationFailure(400, "VALIDATION_ERROR", "Use ownership transfer to assign OWNER");
    }
    private static Member memberSummary(OrganizationMembership member, IdentityDirectoryPort.Account account) {
        if (account==null) throw ApplicationFailure.missing("Member account not found");
        return new Member(member.userId(), account.studentId(), account.fullName(), member.memberRole(), member.joinedAt());
    }
}
