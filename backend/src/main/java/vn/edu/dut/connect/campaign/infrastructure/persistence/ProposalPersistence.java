package vn.edu.dut.connect.campaign.infrastructure.persistence;
import java.util.*;
import java.time.*;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.shared.application.PageResult;
import vn.edu.dut.connect.shared.infrastructure.catalog.DemoCatalogVisibility;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Repository;
import vn.edu.dut.connect.campaign.application.*;
@Repository
public class ProposalPersistence implements ProposalRepository {
    private final JpaProposalRepository proposals;
    private final EntityManager em;
    private final DemoCatalogVisibility catalog;
    public ProposalPersistence(JpaProposalRepository proposals, EntityManager em, DemoCatalogVisibility catalog) { this.proposals = proposals; this.em = em; this.catalog=catalog; }
    public Optional<Proposal> find(UUID id) { return proposals.findById(id); }
    public Optional<Proposal> lock(UUID id) { return proposals.lockById(id); }
    public Proposal save(Proposal p) { return proposals.saveAndFlush(p); }
    public PageResult<Proposal> list(CampaignQuery query, UUID proposer, ProposalStatus status) {
        String where = " from Proposal p where lower(p.content.title) like :q escape '!'";
        Map<String,Object> args = new HashMap<>(); args.put("q", "%" + query.q().toLowerCase(Locale.ROOT).replace("!","!!").replace("%","!%").replace("_","!_") + "%");
        if (!catalog.proposals().isEmpty()) {where+=" and p.id not in (:hidden)"; args.put("hidden",catalog.proposals());}
        if (proposer != null) { where += " and p.proposerUserId=:proposer"; args.put("proposer",proposer); }
        if (status != null) { where += " and p.status=:status"; args.put("status",status); }
        var count = em.createQuery("select count(p)" + where,Long.class);
        var select = em.createQuery("select p" + where + " order by p.createdAt desc,p.id",Proposal.class);
        args.forEach((key,value) -> { count.setParameter(key,value); select.setParameter(key,value); });
        long total = count.getSingleResult();
        long offset = (long)query.page()*query.size();
        var items = offset > Integer.MAX_VALUE ? List.<Proposal>of() : select.setFirstResult((int)offset).setMaxResults(query.size()).getResultList();
        int pages = (int)Math.min(Integer.MAX_VALUE,(total+query.size()-1)/query.size());
        return new PageResult<>(items,query.page(),query.size(),total,pages,query.page()+1L<pages,query.page()>0);
    }
}
