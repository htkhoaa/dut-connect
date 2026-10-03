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
    public CampaignAuthorization(IdentityDirectoryPort identities, CampaignRepository campaigns) { this.identities=identities; this.campaigns=campaigns; }
    public IdentityDirectoryPort.Account active(UUID id) {
        var account=identities.findAccount(id).orElseThrow(()->new ApplicationFailure(401,"AUTHENTICATION_REQUIRED","Account unavailable"));
        if (!account.active()) denied();
        return account;
    }
    public void admin(UUID actor) { if (!active(actor).admin()) denied(); }
    public void manager(UUID campaign, UUID actor) {
        if (!active(actor).admin() && campaigns.role(campaign,actor).isEmpty()) denied();
    }
    public void owner(UUID campaign, UUID actor) {
        if (!active(actor).admin() && campaigns.role(campaign,actor).orElse(null)!=ManagerRole.OWNER) denied();
    }
    public void proposer(Proposal proposal, UUID actor) {
        active(actor);
        if (!proposal.proposerId().equals(actor)) denied();
    }
    private static void denied() { throw new ApplicationFailure(403,"ACCESS_DENIED","Campaign permission required"); }
}
