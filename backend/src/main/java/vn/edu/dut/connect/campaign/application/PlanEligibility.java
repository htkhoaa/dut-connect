package vn.edu.dut.connect.campaign.application;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.shared.application.*;
import vn.edu.dut.connect.identity.application.*;
import vn.edu.dut.connect.organization.application.OrganizationAccessPort;
import static vn.edu.dut.connect.campaign.application.CampaignContracts.*;
@Service
public class PlanEligibility {
    private final CategoryRepository categories;
    private final IdentityDirectoryPort identities;
    private final OrganizationAccessPort organizations;
    public PlanEligibility(CategoryRepository categories, IdentityDirectoryPort identities, OrganizationAccessPort organizations) {
        this.categories=categories; this.identities=identities; this.organizations=organizations;
    }
    public void category(CampaignContent content, UUID existingCategory) {
        var category=categories.lock(content.categoryId()).orElseThrow(()->new CampaignViolation("VALIDATION_ERROR","Category not found","categoryId"));
        if (!category.active() && !category.id().equals(existingCategory))
            throw new CampaignViolation("VALIDATION_ERROR","Select an active category","categoryId");
    }
    public void representative(CampaignContent content, UUID proposer) {
        var account=identities.lockAccount(proposer).orElseThrow(()->ApplicationFailure.missing("Proposer account not found"));
        if (!account.active()) throw new ApplicationFailure(403,"ACCESS_DENIED","Proposer account must be active");
        if (content.organizerType()==OrganizerType.ORGANIZATION) {
            var snapshot=organizations.lockMembership(content.organizationId(),proposer);
            if (!snapshot.verified()) throw new CampaignViolation("ORGANIZATION_NOT_VERIFIED","Organization must be verified");
            if (!snapshot.representative()) throw new ApplicationFailure(403,"NOT_ORGANIZATION_MEMBER","Owner or Manager membership is required to represent this organization");
        }
    }
}
