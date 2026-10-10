package vn.edu.dut.connect.campaign.application;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.shared.application.*;
import vn.edu.dut.connect.identity.application.*;
import static vn.edu.dut.connect.campaign.application.CampaignContracts.*;
import java.util.stream.Collectors;
@Service
public class CampaignSkillsService {
    private final CampaignRepository campaigns;
    private final CampaignAuthorization access;
    private final SkillCatalogPort catalog;
    private final CampaignReadService views;
    public CampaignSkillsService(CampaignRepository campaigns, CampaignAuthorization access, SkillCatalogPort catalog, CampaignReadService views) {
        this.campaigns=campaigns; this.access=access; this.catalog=catalog; this.views=views;
    }
    @Transactional(readOnly=true)
    public PageResult<SkillDto> list(UUID id, UUID actor, CampaignQuery query) {
        campaigns.find(id).orElseThrow(()->ApplicationFailure.missing("Campaign not found")); access.manager(id,actor);
        var items = views.skills(id);
        int start = (int)Math.min(items.size(), (long)query.page()*query.size());
        int pages = (items.size()+query.size()-1)/query.size();
        return new PageResult<>(items.subList(start, Math.min(items.size(),start+query.size())),
                query.page(),query.size(),items.size(),pages,query.page()+1L<pages,query.page()>0);
    }
    @Transactional
    public CampaignDetail replace(UUID id, UUID actor, SkillsRequest request) {
        var campaign=campaigns.lock(id).orElseThrow(()->ApplicationFailure.missing("Campaign not found"));
        access.manager(id,actor); campaign.requireVersion(request.version()); campaign.requireMutable();
        var ids=request.items().stream().map(Requirement::skillId).collect(Collectors.toSet());
        var skills=catalog.findSkills(ids);
        if (ids.stream().anyMatch(skill->!skills.containsKey(skill) || !skills.get(skill).active()))
            throw new CampaignViolation("VALIDATION_ERROR","Choose active skills","items");
        if (request.items().stream().map(item->item.skillId()+":"+item.track()).distinct().count()!=request.items().size())
            throw new CampaignViolation("VALIDATION_ERROR","Each skill and track pair must be unique","items");
        campaigns.replaceSkills(id,request.items()); campaign.touch(); campaigns.save(campaign);
        return views.detail(campaign,actor);
    }
}
