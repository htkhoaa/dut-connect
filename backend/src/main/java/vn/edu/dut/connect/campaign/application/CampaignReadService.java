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
@Service
@Transactional(readOnly=true)
public class CampaignReadService {
    private final CampaignRepository campaigns;
    private final CategoryRepository categories;
    private final CampaignAuthorization access;
    private final IdentityDirectoryPort identities;
    private final OrganizationAccessPort organizations;
    private final SkillCatalogPort skillCatalog;
    public CampaignReadService(CampaignRepository campaigns, CategoryRepository categories, CampaignAuthorization access,
            IdentityDirectoryPort identities, OrganizationAccessPort organizations, SkillCatalogPort skillCatalog) {
        this.campaigns=campaigns; this.categories=categories; this.access=access; this.identities=identities; this.organizations=organizations; this.skillCatalog=skillCatalog;
    }
    public PageResult<CampaignSummary> browse(CampaignQuery query) { return summaries(campaigns.list(query,null,CampaignRepository.Visibility.PUBLIC)); }
    public PageResult<CampaignSummary> mine(UUID actor, CampaignQuery query) { access.active(actor); return summaries(campaigns.list(query,actor,CampaignRepository.Visibility.ALL)); }
    public PageResult<CampaignSummary> adminList(UUID actor, CampaignQuery query) { access.admin(actor); return summaries(campaigns.list(query,null,CampaignRepository.Visibility.ALL)); }
    public CampaignDetail get(String idOrSlug, UUID actor) {
        Optional<Campaign> result;
        try { result=campaigns.find(UUID.fromString(idOrSlug)); }
        catch (IllegalArgumentException ignored) { result=campaigns.bySlug(idOrSlug); }
        if (result.isEmpty()) result=campaigns.bySlug(idOrSlug);
        var campaign=result.orElseThrow(()->ApplicationFailure.missing("Campaign not found"));
        if (campaign.status()==CampaignStatus.DRAFT && (actor==null || (!access.active(actor).admin() && campaigns.role(campaign.id(),actor).isEmpty())))
            throw ApplicationFailure.missing("Campaign not found");
        return detail(campaign,actor);
    }
    public CampaignDetail detail(Campaign c, UUID actor) {
        var contact=identities.findAccount(c.contactId()).orElseThrow(()->ApplicationFailure.missing("Contact not found"));
        String organizer=c.content().organizationId()==null?contact.fullName():organizations.names(Set.of(c.content().organizationId())).get(c.content().organizationId());
        ManagerRole role=actor==null?null:campaigns.role(c.id(),actor).orElse(null);
        boolean admin=actor!=null && access.active(actor).admin();
        boolean mutable=c.status()!=CampaignStatus.COMPLETED && c.status()!=CampaignStatus.CANCELLED;
        return new CampaignDetail(c.id(),c.slug(),c.proposalId(),c.contactId(),contact.fullName(),organizer,categories.find(c.content().categoryId()).orElseThrow().name(),
                ContentDto.from(c.content()),c.status(),c.createdAt(),c.updatedAt(),c.version(),role,mutable && (admin || role!=null),mutable && (admin || role==ManagerRole.OWNER),skills(c.id()));
    }
    public List<SkillDto> skills(UUID id) {
        var items=campaigns.skills(id);
        var names=skillCatalog.findSkills(items.stream().map(Requirement::skillId).collect(Collectors.toSet()));
        return items.stream().map(item->new SkillDto(item.skillId(),names.get(item.skillId()).name(),item.track(),item.importance())).toList();
    }
    private PageResult<CampaignSummary> summaries(PageResult<Campaign> page) {
        var contacts=identities.findAccounts(page.items().stream().map(Campaign::contactId).collect(Collectors.toSet()));
        var names=organizations.names(page.items().stream().map(c->c.content().organizationId()).filter(Objects::nonNull).collect(Collectors.toSet()));
        var catalog=categories.findAll(page.items().stream().map(c->c.content().categoryId()).collect(Collectors.toSet()));
        return page.map(c->new CampaignSummary(c.id(),c.slug(),c.content().title(),c.content().summary(),c.content().organizationId()==null?contacts.get(c.contactId()).fullName():names.get(c.content().organizationId()),
                catalog.get(c.content().categoryId()).name(),c.content().categoryId(),c.content().organizationId(),c.content().contributionMode(),c.status(),c.content().startDate(),c.content().endDate(),
                c.content().targetVolunteerCount(),c.content().fundraisingGoal()==null?null:c.content().fundraisingGoal().toPlainString(),c.createdAt(),c.version()));
    }
}
