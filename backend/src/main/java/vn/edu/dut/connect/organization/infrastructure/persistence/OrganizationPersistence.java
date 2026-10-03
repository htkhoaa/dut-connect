package vn.edu.dut.connect.organization.infrastructure.persistence;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.edu.dut.connect.organization.application.*;
import vn.edu.dut.connect.organization.domain.*;
import vn.edu.dut.connect.shared.application.PageResult;
import vn.edu.dut.connect.shared.infrastructure.catalog.DemoCatalogVisibility;
import static vn.edu.dut.connect.organization.application.OrganizationContracts.*;
@Repository
public class OrganizationPersistence implements OrganizationRepository {
    private final JpaOrganizationRepository organizations;
    private final JdbcClient jdbc;
    private final DemoCatalogVisibility catalog;
    public OrganizationPersistence(JpaOrganizationRepository organizations, JdbcClient jdbc, DemoCatalogVisibility catalog) {
        this.organizations=organizations;
        this.jdbc=jdbc;
        this.catalog=catalog;
    }
    public Optional<Organization> find(UUID id) {
        return organizations.findById(id);
    }
    public Map<UUID, String> names(Set<UUID> ids) {
        if (ids.isEmpty()) return Map.of();
        return jdbc.sql("select id,name from dut_connect.organizations where id in (:ids)").param("ids", ids)
                .query((row, number) -> Map.entry(row.getObject("id", UUID.class), row.getString("name")))
                .list().stream().collect(java.util.stream.Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }
    public Optional<Organization> lock(UUID id) {
        return organizations.lockById(id);
    }
    public Organization save(Organization organization) {
        return organizations.saveAndFlush(organization);
    }
    public boolean slugExists(String slug) {
        return organizations.existsBySlug(slug);
    }
    public void lockSlugAllocation(String base) {
        jdbc.sql("select pg_advisory_xact_lock(hashtextextended('organization-slug:' || :base, 0))")
                .param("base", base).query((row, number) -> true).single();
    }
    public Optional<TypeSummary> type(UUID id) {
        return jdbc.sql("select id,code,name,active from dut_connect.organization_types where id=:id").param("id", id).query(TypeSummary.class).optional();
    }
    public PageResult<TypeSummary> types(OrganizationQuery query) {
        long count=jdbc.sql("select count(*) from dut_connect.organization_types where active").query(Long.class).single();
        var items=jdbc.sql("select id,code,name,active from dut_connect.organization_types where active order by name,id limit :size offset :offset")
        .param("size", query.size()).param("offset", (long)query.page()*query.size()).query(TypeSummary.class).list();
        return page(items, query, count);
    }
    public PageResult<Summary> browse(OrganizationQuery query, OrganizationStatus status, UUID member) {
        String from=" from dut_connect.organizations o join dut_connect.organization_types t on t.id=o.organization_type_id where o.name ilike :q escape '\\'";
        Map<String, Object> params=new HashMap<>();
        params.put("q", "%"+query.q().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")+"%");
        if (!catalog.organizations().isEmpty()) {from+=" and o.id not in (:hidden)"; params.put("hidden",catalog.organizations());}
        if (status!=null) {
            from+=" and o.status=:status";
            params.put("status", status.name());
        }
        if (member!=null) {
            from+=" and exists(select 1 from dut_connect.organization_members m where m.organization_id=o.id and m.user_id=:user)";
            params.put("user", member);
        }
        long count=jdbc.sql("select count(*)"+from).params(params).query(Long.class).single();
        var items=jdbc.sql("select o.id,o.name,o.slug,o.organization_type_id,t.name as organization_type_name,o.status,o.version,o.created_at,o.description"+from+" order by o.created_at desc,o.id limit :size offset :offset")
        .params(params).param("size", query.size()).param("offset", (long)query.page()*query.size()).query(Summary.class).list();
        return page(items, query, count);
    }
    public Optional<MemberRole> role(UUID id, UUID user) {
        return jdbc.sql("select member_role from dut_connect.organization_members where organization_id=:id and user_id=:user")
        .param("id", id).param("user", user).query(String.class).optional().map(MemberRole::valueOf);
    }
    public long ownerCount(UUID id) {
        return jdbc.sql("select count(*) from dut_connect.organization_members where organization_id=:id and member_role='OWNER'").param("id", id).query(Long.class).single();
    }
    private static final String MEMBERS="select m.user_id,m.member_role,m.joined_at from dut_connect.organization_members m where m.organization_id=:id";
    public PageResult<OrganizationMembership> members(UUID id, OrganizationQuery query) {
        long count=jdbc.sql("select count(*) from dut_connect.organization_members where organization_id=:id").param("id", id).query(Long.class).single();
        var items=jdbc.sql(MEMBERS+" order by m.joined_at,m.user_id limit :size offset :offset").param("id", id)
        .param("size", query.size()).param("offset", (long)query.page()*query.size()).query(OrganizationMembership.class).list();
        return page(items, query, count);
    }
    public Optional<OrganizationMembership> member(UUID id, UUID user) {
        return jdbc.sql(MEMBERS+" and m.user_id=:user").param("id", id).param("user", user).query(OrganizationMembership.class).optional();
    }
    public void addMember(UUID id, UUID user, MemberRole role) {
        jdbc.sql("insert into dut_connect.organization_members(organization_id,user_id,member_role,joined_at) values(:id,:user,:role,:joined)")
        .param("id", id).param("user", user).param("role", role.name()).param("joined", java.sql.Timestamp.from(java.time.Instant.now())).update();
    }
    public void changeRole(UUID id, UUID user, MemberRole role) {
        jdbc.sql("update dut_connect.organization_members set member_role=:role where organization_id=:id and user_id=:user")
        .param("id", id).param("user", user).param("role", role.name()).update();
    }
    public void removeMember(UUID id, UUID user) {
        jdbc.sql("delete from dut_connect.organization_members where organization_id=:id and user_id=:user").param("id", id).param("user", user).update();
    }
    private static <T> PageResult<T> page(List<T> items, OrganizationQuery query, long total) {
        int pages=(int)Math.min(Integer.MAX_VALUE, (total+query.size()-1)/query.size());
        return new PageResult<>(items, query.page(), query.size(), total, pages, query.page()+1L<pages, query.page()>0);
    }
}
