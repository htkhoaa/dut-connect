package vn.edu.dut.connect.campaign.application;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.shared.application.*;
import vn.edu.dut.connect.identity.application.*;
import vn.edu.dut.connect.organization.application.OrganizationAccessPort;
import static vn.edu.dut.connect.campaign.application.CampaignContracts.*;
import vn.edu.dut.connect.notification.application.NotificationService;
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
    private final NotificationService notificationService;
    public ProposalReviewService(ProposalRepository proposals, CampaignRepository campaigns, CampaignAuthorization access, PlanEligibility eligibility,
            ProposalService proposalViews, CampaignReadService campaignViews, NotificationService notificationService) {
        this.proposals=proposals; this.campaigns=campaigns; this.access=access; this.eligibility=eligibility; this.proposalViews=proposalViews; this.campaignViews=campaignViews;
        this.notificationService=notificationService;
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
        try {
            notificationService.notifyUser(
                proposal.proposerId(),
                "PROPOSAL_APPROVED",
                "Đề xuất chiến dịch đã được duyệt!",
                "Đề xuất chiến dịch '" + proposal.content().title() + "' đã được Quản trị viên phê duyệt thành công.",
                "CAMPAIGN",
                campaign.id()
            );
        } catch (Exception e) {
            log.warn("Failed sending proposal approval notification: {}", e.getMessage());
        }
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
        try {
            String reasonText = (request.reason() != null && !request.reason().isBlank()) ? ": " + request.reason() : ".";
            notificationService.notifyUser(
                proposal.proposerId(),
                "PROPOSAL_REJECTED",
                "Đề xuất chiến dịch bị từ chối",
                "Đề xuất chiến dịch '" + proposal.content().title() + "' của bạn đã bị từ chối" + reasonText,
                "PROPOSAL",
                proposal.id()
            );
        } catch (Exception e) {
            log.warn("Failed sending proposal rejection notification: {}", e.getMessage());
        }
        return proposalViews.detail(proposal,actor);
    }
}
