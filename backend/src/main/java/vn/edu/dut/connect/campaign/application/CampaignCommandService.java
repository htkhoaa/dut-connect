package vn.edu.dut.connect.campaign.application;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.shared.application.*;
import vn.edu.dut.connect.identity.application.*;
import vn.edu.dut.connect.organization.application.OrganizationAccessPort;
import static vn.edu.dut.connect.campaign.application.CampaignContracts.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
@Service
public class CampaignCommandService {
    private static final Logger log=LoggerFactory.getLogger(CampaignCommandService.class);
    private final CampaignRepository campaigns;
    private final CampaignAuthorization access;
    private final PlanEligibility eligibility;
    private final CampaignReadService views;
    public CampaignCommandService(CampaignRepository campaigns, CampaignAuthorization access, PlanEligibility eligibility, CampaignReadService views) {
        this.campaigns=campaigns; this.access=access; this.eligibility=eligibility; this.views=views;
    }
    @Transactional
    public CampaignDetail edit(UUID id, UUID actor, PatchRequest request) {
        var campaign=campaigns.lock(id).orElseThrow(()->ApplicationFailure.missing("Campaign not found"));
        access.manager(id,actor); campaign.requireVersion(request.version()); campaign.requireMutable();
        var content=campaign.content().merge(request.content(),request.clearFields());
        eligibility.category(content,campaign.content().categoryId()); campaign.edit(content); campaigns.save(campaign);
        return views.detail(campaign,actor);
    }
    @Transactional
    public CampaignDetail transition(UUID id, UUID actor, VersionRequest request, CampaignStatus next) {
        var campaign=campaigns.lock(id).orElseThrow(()->ApplicationFailure.missing("Campaign not found"));
        access.manager(id,actor); campaign.requireVersion(request.version()); campaign.transition(next); campaigns.save(campaign);
        log.info("Campaign transitioned actor={} campaign={} status={}",actor,id,next);
        return views.detail(campaign,actor);
    }
}
