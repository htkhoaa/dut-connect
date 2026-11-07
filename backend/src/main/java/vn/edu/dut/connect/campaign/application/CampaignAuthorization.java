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
public class CampaignAuthorization {
    private final IdentityDirectoryPort identities;
    private final CampaignRepository campaigns;
    private final OrganizationAccessPort organizations;

    public CampaignAuthorization(IdentityDirectoryPort identities, CampaignRepository campaigns, OrganizationAccessPort organizations) {
        this.identities = identities;
        this.campaigns = campaigns;
        this.organizations = organizations;
    }

    public IdentityDirectoryPort.Account active(UUID id) {
        var account = identities.findAccount(id).orElseThrow(() -> new ApplicationFailure(401, "AUTHENTICATION_REQUIRED", "Account unavailable"));
        if (!account.active()) denied();
        return account;
    }

    public void admin(UUID actor) {
        if (!active(actor).admin()) denied();
    }

    public void manager(UUID campaign, UUID actor) {
        var account = active(actor);
        if (account.admin()) return;
        if (campaigns.role(campaign, actor).isPresent()) return;
        var c = campaigns.find(campaign).orElse(null);
        if (c != null) {
            if (c.contactId().equals(actor)) return;
            UUID orgId = c.content().organizationId();
            if (orgId != null && organizations.canRepresent(orgId, actor)) return;
        }
        denied();
    }

    public void owner(UUID campaign, UUID actor) {
        manager(campaign, actor);
    }
    public void proposer(Proposal proposal, UUID actor) {
        active(actor);
        if (!proposal.proposerId().equals(actor)) denied();
    }
    private static void denied() { throw new ApplicationFailure(403,"ACCESS_DENIED","Campaign permission required"); }
}
