package vn.edu.dut.connect.campaign.infrastructure.persistence;
import java.util.*;
import java.time.*;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.shared.application.PageResult;
import vn.edu.dut.connect.shared.infrastructure.catalog.DemoCatalogVisibility;
import jakarta.persistence.EntityManager;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.edu.dut.connect.campaign.application.*;
@Repository
public class CategoryPersistence implements CategoryRepository {
    private final JpaCategoryRepository categories;
    private final EntityManager em;
    private final JdbcClient jdbc;
    private final DemoCatalogVisibility catalog;
    public CategoryPersistence(JpaCategoryRepository categories, EntityManager em, JdbcClient jdbc, DemoCatalogVisibility catalog) { this.categories=categories; this.em=em; this.jdbc=jdbc; this.catalog=catalog; }
    public Optional<CampaignCategory> find(UUID id) { return categories.findById(id); }
    public Optional<CampaignCategory> lock(UUID id) { return categories.lockById(id); }
    public CampaignCategory save(CampaignCategory c) { return categories.saveAndFlush(c); }
    public Map<UUID,CampaignCategory> findAll(Set<UUID> ids) {
        return categories.findAllById(ids).stream().collect(java.util.stream.Collectors.toMap(CampaignCategory::id,c->c));
    }
    public void lockSlug(String slug) { jdbc.sql("select pg_advisory_xact_lock(hashtextextended('category-slug:' || :slug,0))").param("slug",slug).query((r,n)->true).single(); }
    public boolean slugExists(String slug) { return categories.existsBySlug(slug); }
    public PageResult<CampaignCategory> list(CampaignQuery query, Visibility visibility) {
        String from = " from CampaignCategory c where 1=1" + (visibility==Visibility.ACTIVE ? " and c.active=true" : "");
        if (!catalog.categories().isEmpty()) from+=" and c.id not in (:hidden)";
        var count = em.createQuery("select count(c)" + from,Long.class);
        var select = em.createQuery("select c" + from + " order by c.name,c.id",CampaignCategory.class);
        if (!catalog.categories().isEmpty()) {count.setParameter("hidden",catalog.categories()); select.setParameter("hidden",catalog.categories());}
        long total = count.getSingleResult();
        long offset = (long)query.page()*query.size();
        var items = offset > Integer.MAX_VALUE ? List.<CampaignCategory>of() : select.setFirstResult((int)offset).setMaxResults(query.size()).getResultList();
        int pages=(int)Math.min(Integer.MAX_VALUE,(total+query.size()-1)/query.size());
        return new PageResult<>(items,query.page(),query.size(),total,pages,query.page()+1L<pages,query.page()>0);
    }
}
