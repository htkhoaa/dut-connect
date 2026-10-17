package vn.edu.dut.connect.campaign.infrastructure.persistence;
import java.util.*;
import java.time.*;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.shared.application.PageResult;
import vn.edu.dut.connect.shared.infrastructure.catalog.DemoCatalogVisibility;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.edu.dut.connect.campaign.application.*;
import static vn.edu.dut.connect.campaign.application.CampaignContracts.*;
@Repository
public class CampaignPersistence implements CampaignRepository {
    private final JpaCampaignRepository campaigns;
    private final JdbcClient jdbc;
    private final DemoCatalogVisibility catalog;
    public CampaignPersistence(JpaCampaignRepository campaigns, JdbcClient jdbc, DemoCatalogVisibility catalog) { this.campaigns=campaigns; this.jdbc=jdbc; this.catalog=catalog; }
    public Optional<Campaign> find(UUID id) { return campaigns.findById(id); }
    public List<Campaign> findAll(Set<UUID> ids) { return campaigns.findAllById(ids); }
    public Optional<Campaign> bySlug(String slug) { return campaigns.findBySlug(slug); }
    public Optional<Campaign> byProposal(UUID id) { return campaigns.findByProposalId(id); }
    public Optional<Campaign> lock(UUID id) { return campaigns.lockById(id); }
    public Campaign save(Campaign c) { return campaigns.saveAndFlush(c); }
    public void lockSlug(String slug) { jdbc.sql("select pg_advisory_xact_lock(hashtextextended('campaign-slug:' || :slug,0))").param("slug",slug).query((r,n)->true).single(); }
    public boolean slugExists(String slug) { return campaigns.existsBySlug(slug); }
    public Optional<ManagerRole> role(UUID id, UUID user) {
        return jdbc.sql("select manager_role from dut_connect_midterm.campaign_managers where campaign_id=:id and user_id=:user")
                .param("id",id).param("user",user).query(String.class).optional().map(ManagerRole::valueOf);
    }
    public Set<UUID> managedCampaigns(Set<UUID> ids,UUID user){if(ids.isEmpty())return Set.of();return new HashSet<>(jdbc.sql("select campaign_id from dut_connect_midterm.campaign_managers where campaign_id in(:ids) and user_id=:u").param("ids",ids).param("u",user).query(UUID.class).list());}
    public void addManager(UUID id, UUID user, ManagerRole role) {
        jdbc.sql("insert into dut_connect_midterm.campaign_managers(campaign_id,user_id,manager_role,created_at) values(:id,:user,:role,:now)")
                .param("id",id).param("user",user).param("role",role.name()).param("now",java.sql.Timestamp.from(Instant.now())).update();
    }
    public void removeManager(UUID id, UUID user) {
        jdbc.sql("delete from dut_connect_midterm.campaign_managers where campaign_id=:id and user_id=:user").param("id",id).param("user",user).update();
    }
    public PageResult<ManagerMembership> managers(UUID id, CampaignQuery query) {
        long total=jdbc.sql("select count(*) from dut_connect_midterm.campaign_managers where campaign_id=:id").param("id",id).query(Long.class).single();
        var items=jdbc.sql("select user_id,manager_role,created_at from dut_connect_midterm.campaign_managers where campaign_id=:id order by created_at,user_id limit :size offset :offset")
                .param("id",id).param("size",query.size()).param("offset",(long)query.page()*query.size()).query(ManagerMembership.class).list();
        int pages=(int)Math.min(Integer.MAX_VALUE,(total+query.size()-1)/query.size());
        return new PageResult<>(items,query.page(),query.size(),total,pages,query.page()+1L<pages,query.page()>0);
    }
    public List<Requirement> skills(UUID id) {
        return jdbc.sql("select skill_id,track,importance from dut_connect_midterm.campaign_skill_requirements where campaign_id=:id order by track,skill_id").param("id",id).query(Requirement.class).list();
    }
    public void replaceSkills(UUID id, List<Requirement> items) {
        jdbc.sql("delete from dut_connect_midterm.campaign_skill_requirements where campaign_id=:id").param("id",id).update();
        for (var item : items) jdbc.sql("insert into dut_connect_midterm.campaign_skill_requirements(campaign_id,skill_id,track,importance) values(:id,:skill,:track,:importance)")
                .param("id",id).param("skill",item.skillId()).param("track",item.track().name()).param("importance",item.importance()).update();
    }
    public PageResult<Campaign> list(CampaignQuery query, UUID manager, Visibility visibility) {
        String where=" from dut_connect_midterm.campaigns c where lower(c.title) like :q escape '!'";
        Map<String,Object> args=new HashMap<>(); args.put("q","%"+query.q().toLowerCase(Locale.ROOT).replace("!","!!").replace("%","!%").replace("_","!_")+"%");
        if (!catalog.campaigns().isEmpty()) {where+=" and c.id not in (:hidden)"; args.put("hidden",catalog.campaigns());}
        if (visibility==Visibility.PUBLIC) { where+=" and c.status <> :draft"; args.put("draft",CampaignStatus.DRAFT.name()); }
        if (manager!=null) {
            where+=" and exists(select 1 from dut_connect_midterm.campaign_managers m where m.campaign_id=c.id and m.user_id=:manager)";
            args.put("manager",manager);
        }
        if (query.status()!=null) { where+=" and c.status=:status"; args.put("status",query.status().name()); }
        if (query.categoryId()!=null) { where+=" and c.category_id=:category"; args.put("category",query.categoryId()); }
        if (query.contributionMode()!=null) { where+=" and c.contribution_mode=:mode"; args.put("mode",query.contributionMode().name()); }
        if (query.organizationId()!=null) { where+=" and c.organization_id=:organization"; args.put("organization",query.organizationId()); }
        long total=jdbc.sql("select count(*)"+where).params(args).query(Long.class).single();
        String order=query.sort().equals("startDate")?"c.start_date,c.id":"c.created_at desc,c.id";
        var ids=jdbc.sql("select c.id"+where+" order by "+order+" limit :size offset :offset").params(args)
                .param("size",query.size()).param("offset",(long)query.page()*query.size()).query(UUID.class).list();
        var byId=campaigns.findAllById(ids).stream().collect(java.util.stream.Collectors.toMap(Campaign::id,c->c));
        var items=ids.stream().map(byId::get).toList();
        int pages=(int)Math.min(Integer.MAX_VALUE,(total+query.size()-1)/query.size());
        return new PageResult<>(items,query.page(),query.size(),total,pages,query.page()+1L<pages,query.page()>0);
    }
}
