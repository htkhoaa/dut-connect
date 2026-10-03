package vn.edu.dut.connect.finance.application;

import java.util.UUID;
import java.util.Collection;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import vn.edu.dut.connect.campaign.application.CampaignAccessPort;
import vn.edu.dut.connect.campaign.domain.CampaignStatus;
import vn.edu.dut.connect.identity.application.IdentityDirectoryPort;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

@Service
public class FinanceAuthorization {
    private final IdentityDirectoryPort identities;
    private final CampaignAccessPort campaigns;
    public FinanceAuthorization(IdentityDirectoryPort identities,CampaignAccessPort campaigns){this.identities=identities;this.campaigns=campaigns;}
    public IdentityDirectoryPort.Account active(UUID actor){
        var account=identities.findAccount(actor).orElseThrow(()->new ApplicationFailure(401,"AUTHENTICATION_REQUIRED","Account unavailable"));
        if(!account.active()) denied();return account;
    }
    public void admin(UUID actor){if(!active(actor).admin())denied();}
    public void manager(UUID campaign,UUID actor){if(!active(actor).admin()&&!campaigns.isManager(campaign,actor))denied();}
    public void visible(CampaignAccessPort.Snapshot c,UUID actor){if(c.status()==CampaignStatus.DRAFT&&(actor==null||(!active(actor).admin()&&!campaigns.isManager(c.id(),actor))))throw ApplicationFailure.missing("Campaign not found");}
    public void visible(Collection<CampaignAccessPort.Snapshot> snapshots,UUID actor){
        var drafts=snapshots.stream().filter(c->c.status()==CampaignStatus.DRAFT).map(CampaignAccessPort.Snapshot::id).collect(Collectors.toSet());
        if(drafts.isEmpty())return;
        if(actor==null)throw ApplicationFailure.missing("Campaign not found");
        if(!active(actor).admin()&&!campaigns.managedCampaigns(drafts,actor).containsAll(drafts))throw ApplicationFailure.missing("Campaign not found");
    }
    public void mutable(CampaignAccessPort.Snapshot c){if(c.status()==CampaignStatus.COMPLETED||c.status()==CampaignStatus.CANCELLED)throw new ApplicationFailure(409,"INVALID_STATE_TRANSITION","Completed and cancelled campaigns do not accept expense submission or editing");}
    private static void denied(){throw new ApplicationFailure(403,"ACCESS_DENIED","Finance permission required");}
}
