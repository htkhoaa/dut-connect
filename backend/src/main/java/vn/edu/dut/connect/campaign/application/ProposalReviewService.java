package vn.edu.dut.connect.campaign.application;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.shared.application.*;
import vn.edu.dut.connect.identity.application.*;
import static vn.edu.dut.connect.campaign.application.CampaignContracts.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
@Service
public class ProposalReviewService {
    private static final Logger log=LoggerFactory.getLogger(ProposalReviewService.class);
    private final ProposalRepository proposals;
    private final CampaignRepository campaigns;
    private final CampaignAuthorization access;
    private final PlanEligibility eligibility;
    private final ProposalService proposalViews;
    private final CampaignReadService campaignViews;
    public ProposalReviewService(ProposalRepository proposals, CampaignRepository campaigns, CampaignAuthorization access, PlanEligibility eligibility,
            ProposalService proposalViews, CampaignReadService campaignViews) {
        this.proposals=proposals; this.campaigns=campaigns; this.access=access; this.eligibility=eligibility; this.proposalViews=proposalViews; this.campaignViews=campaignViews;
    }
    @Transactional
    public CampaignDetail approve(UUID id, UUID actor, VersionRequest request) {
        access.admin(actor);
        var proposal=proposals.lock(id).orElseThrow(()->ApplicationFailure.missing("Proposal not found"));
        proposal.requireVersion(request.version()); proposal.requirePending();
        eligibility.category(proposal.content(),null); eligibility.representative(proposal.content(),proposal.proposerId());
        String base=ReadableSlug.base(proposal.content().title()); campaigns.lockSlug(base);
        String slug=initialSlug(base);
        for (int attempts=0; campaigns.slugExists(slug); attempts++) {
            if (attempts>=5) throw ApplicationFailure.conflict("Unable to allocate campaign slug");
            slug=ReadableSlug.suffix(base);
        }
        proposal.approve(actor); proposals.save(proposal);
        var campaign=campaigns.save(new Campaign(proposal,slug));
        campaigns.addManager(campaign.id(),proposal.proposerId(),ManagerRole.OWNER);
        log.info("Proposal approved actor={} proposal={} campaign={}",actor,id,campaign.id());
        return campaignViews.detail(campaign,actor);
    }
    private String initialSlug(String base) {
        try {
            UUID.fromString(base);
            return ReadableSlug.suffix(base);
        } catch (IllegalArgumentException notUuid) {
            return base;
        }
    }
    @Transactional
    public ProposalDetail reject(UUID id, UUID actor, RejectRequest request) {
        access.admin(actor);
        var proposal=proposals.lock(id).orElseThrow(()->ApplicationFailure.missing("Proposal not found"));
        proposal.requireVersion(request.version()); proposal.reject(actor,request.reason()); proposals.save(proposal);
        log.info("Proposal rejected actor={} proposal={}",actor,id);
        return proposalViews.detail(proposal,actor);
    }
}
