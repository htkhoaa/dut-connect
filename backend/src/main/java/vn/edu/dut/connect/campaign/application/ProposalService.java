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
public class ProposalService {
    private static final Logger log=LoggerFactory.getLogger(ProposalService.class);
    private final ProposalRepository proposals;
    private final CampaignRepository campaigns;
    private final CategoryRepository categories;
    private final CampaignAuthorization access;
    private final PlanEligibility eligibility;
    private final IdentityDirectoryPort identities;
    private final OrganizationAccessPort organizations;
    public ProposalService(ProposalRepository proposals, CampaignRepository campaigns, CategoryRepository categories, CampaignAuthorization access,
            PlanEligibility eligibility, IdentityDirectoryPort identities, OrganizationAccessPort organizations) {
        this.proposals=proposals; this.campaigns=campaigns; this.categories=categories; this.access=access; this.eligibility=eligibility; this.identities=identities; this.organizations=organizations;
    }
    @Transactional(readOnly=true)
    public PageResult<ProposalSummary> mine(UUID actor, CampaignQuery query) { access.active(actor); return proposals.list(query,actor,null).map(this::summary); }
    @Transactional(readOnly=true)
    public PageResult<ProposalSummary> adminList(UUID actor, CampaignQuery query, ProposalStatus status) { access.admin(actor); return proposals.list(query,null,status).map(this::summary); }
    @Transactional(readOnly=true)
    public ProposalDetail get(UUID id, UUID actor) {
        var proposal=proposals.find(id).orElseThrow(()->ApplicationFailure.missing("Proposal not found"));
        if (!access.active(actor).admin() && !proposal.proposerId().equals(actor)) throw new ApplicationFailure(403,"ACCESS_DENIED","Proposal is private");
        return detail(proposal,actor);
    }
    @Transactional
    public ProposalDetail create(UUID actor, CreateRequest request) {
        access.active(actor);
        var content=new CampaignContent(request.content()); eligibility.category(content,null); eligibility.representative(content,actor);
        var proposal=proposals.save(new Proposal(actor,content));
        log.info("Proposal created actor={} proposal={}",actor,proposal.id());
        return detail(proposal,actor);
    }
    @Transactional
    public ProposalDetail edit(UUID id, UUID actor, PatchRequest request) {
        var proposal=proposals.lock(id).orElseThrow(()->ApplicationFailure.missing("Proposal not found"));
        access.proposer(proposal,actor); proposal.requireVersion(request.version()); proposal.requirePending();
        var content=proposal.content().merge(request.content(),request.clearFields());
        eligibility.category(content,proposal.content().categoryId()); eligibility.representative(content,actor);
        proposal.edit(content); proposals.save(proposal);
        return detail(proposal,actor);
    }
    public ProposalDetail detail(Proposal p, UUID actor) {
        var proposer=identities.findAccount(p.proposerId()).orElseThrow(()->ApplicationFailure.missing("Proposer not found"));
        String category=categories.find(p.content().categoryId()).orElseThrow().name();
        String organization=p.content().organizationId()==null?null:organizations.names(Set.of(p.content().organizationId())).get(p.content().organizationId());
        return new ProposalDetail(p.id(),p.proposerId(),proposer.fullName(),ContentDto.from(p.content()),category,organization,p.status(),p.rejectionReason(),p.reviewerId(),p.reviewedAt(),p.createdAt(),p.updatedAt(),p.version(),campaigns.byProposal(p.id()).map(Campaign::id).orElse(null),p.status()==ProposalStatus.PENDING && p.proposerId().equals(actor));
    }
    private ProposalSummary summary(Proposal p) { return new ProposalSummary(p.id(),p.content().title(),p.content().organizerType(),p.status(),p.version(),p.createdAt()); }
}
