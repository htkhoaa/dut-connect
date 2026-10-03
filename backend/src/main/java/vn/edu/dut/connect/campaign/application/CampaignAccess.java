package vn.edu.dut.connect.campaign.application;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.shared.application.*;
import vn.edu.dut.connect.identity.application.*;
import vn.edu.dut.connect.organization.application.OrganizationAccessPort;
import static vn.edu.dut.connect.campaign.application.CampaignContracts.*;
@Service @Transactional(readOnly=true)
public class CampaignAccess implements CampaignAccessPort {
    private final CampaignRepository campaigns;
    private final IdentityDirectoryPort identities;
    public CampaignAccess(CampaignRepository campaigns, IdentityDirectoryPort identities) { this.campaigns=campaigns; this.identities=identities; }
    public Snapshot getCampaign(UUID id) {
        var c=campaigns.find(id).orElseThrow(()->ApplicationFailure.missing("Campaign not found"));
        return snapshot(c);
    }
    public Funding funding(UUID id) {
        var c=campaigns.find(id).orElseThrow(()->ApplicationFailure.missing("Campaign not found")).content();
        return new Funding(c.institutionalFunding(),c.sponsorFunding(),c.fundraisingGoal());
    }
    @Transactional
    public Snapshot lockCampaign(UUID id) {
        return snapshot(campaigns.lock(id).orElseThrow(()->ApplicationFailure.missing("Campaign not found")));
    }
    public Map<UUID, Snapshot> getCampaigns(Set<UUID> ids) {
        return campaigns.findAll(ids).stream().collect(java.util.stream.Collectors.toMap(Campaign::id, this::snapshot));
    }
    private Snapshot snapshot(Campaign c) {
        var v=c.content();
        return new Snapshot(c.id(),c.status(),v.contributionMode(),v.applicationDeadline(),v.fundraisingDeadline(),v.targetVolunteerCount(),v.targetTechnicalCount(),v.targetLogisticsCount(),v.title(),c.slug());
    }
    public Set<UUID> managedCampaigns(Set<UUID> ids,UUID user){return campaigns.managedCampaigns(ids,user);}
    public boolean isManager(UUID id, UUID user) {
        return identities.findAccount(user).filter(IdentityDirectoryPort.Account::active).isPresent() && campaigns.role(id,user).isPresent();
    }
}
