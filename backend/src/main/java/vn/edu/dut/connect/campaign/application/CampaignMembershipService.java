package vn.edu.dut.connect.campaign.application;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.shared.application.*;
import vn.edu.dut.connect.identity.application.*;
import vn.edu.dut.connect.organization.application.OrganizationAccessPort;
import static vn.edu.dut.connect.campaign.application.CampaignContracts.*;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
@Service
public class CampaignMembershipService {
    private static final Logger log=LoggerFactory.getLogger(CampaignMembershipService.class);
    private final CampaignRepository campaigns;
    private final CampaignAuthorization access;
    private final IdentityDirectoryPort identities;
    private final OrganizationAccessPort organizations;
    private final CampaignReadService views;
    public CampaignMembershipService(CampaignRepository campaigns, CampaignAuthorization access, IdentityDirectoryPort identities,
            OrganizationAccessPort organizations, CampaignReadService views) {
        this.campaigns=campaigns; this.access=access; this.identities=identities; this.organizations=organizations; this.views=views;
    }
    @Transactional(readOnly=true)
    public PageResult<ManagerDto> list(UUID id, UUID actor, CampaignQuery query) {
        campaigns.find(id).orElseThrow(()->ApplicationFailure.missing("Campaign not found")); access.manager(id,actor);
        var page=campaigns.managers(id,query);
        var accounts=identities.findAccounts(page.items().stream().map(ManagerMembership::userId).collect(Collectors.toSet()));
        return page.map(m->new ManagerDto(m.userId(),accounts.get(m.userId()).studentId(),accounts.get(m.userId()).fullName(),m.managerRole(),m.createdAt()));
    }
    @Transactional
    public CampaignDetail add(UUID id, UUID actor, AddManagerRequest request) {
        var campaign=campaigns.lock(id).orElseThrow(()->ApplicationFailure.missing("Campaign not found"));
        access.owner(id,actor); campaign.requireVersion(request.version()); campaign.requireMutable();
        var found=identities.findStudent(request.studentId().trim().toUpperCase(Locale.ROOT)).orElseThrow(()->ApplicationFailure.missing("Student not found"));
        var target=identities.lockAccount(found.id()).orElseThrow();
        if (!target.active()) throw new ApplicationFailure(400,"VALIDATION_ERROR","Choose an active account");
        if (campaign.content().organizationId()!=null && !organizations.lockMembership(campaign.content().organizationId(),target.id()).member())
            throw new ApplicationFailure(403,"NOT_ORGANIZATION_MEMBER","New campaign managers must be organization members");
        if (campaigns.role(id,target.id()).isPresent()) throw ApplicationFailure.conflict("User is already a campaign manager");
        campaigns.addManager(id,target.id(),ManagerRole.MANAGER); changed(campaign,actor,target.id());
        return views.detail(campaign,actor);
    }
    @Transactional
    public void remove(UUID id, UUID actor, UUID target, long version) {
        if (version<0) throw new ApplicationFailure(400,"VALIDATION_ERROR","Version must be nonnegative");
        var campaign=campaigns.lock(id).orElseThrow(()->ApplicationFailure.missing("Campaign not found"));
        access.owner(id,actor); campaign.requireVersion(version); campaign.requireMutable();
        var role=campaigns.role(id,target).orElseThrow(()->ApplicationFailure.missing("Manager not found"));
        if (role==ManagerRole.OWNER) throw ApplicationFailure.conflict("The campaign owner cannot be removed");
        campaigns.removeManager(id,target); changed(campaign,actor,target);
    }
    private void changed(Campaign c, UUID actor, UUID target) {
        c.touch(); campaigns.save(c); log.info("Campaign managers changed actor={} campaign={} target={}",actor,c.id(),target);
    }
}
