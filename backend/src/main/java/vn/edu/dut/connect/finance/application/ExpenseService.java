package vn.edu.dut.connect.finance.application;

import java.util.*;
import org.slf4j.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.campaign.application.CampaignAccessPort;
import vn.edu.dut.connect.finance.domain.Expense;
import vn.edu.dut.connect.shared.application.ApplicationFailure;
import static vn.edu.dut.connect.finance.application.FinanceContracts.*;

@Service @Transactional
public class ExpenseService {
    private static final Logger log=LoggerFactory.getLogger(ExpenseService.class);
    private final ExpenseRepository expenses;
    private final CampaignAccessPort campaigns;
    private final FinanceAuthorization access;
    private final FinanceReadService reads;
    public ExpenseService(ExpenseRepository expenses,CampaignAccessPort campaigns,FinanceAuthorization access,FinanceReadService reads){this.expenses=expenses;this.campaigns=campaigns;this.access=access;this.reads=reads;}
    public ExpenseDto create(UUID campaign,UUID actor,CreateRequest r){
        access.manager(campaign,actor);access.mutable(campaigns.lockCampaign(campaign));access.manager(campaign,actor);
        var e=expenses.save(new Expense(campaign,actor,r.title(),r.category(),r.amount(),r.expenseDate(),r.description(),r.proofReference()));
        log.info("Expense submitted: campaignId={} expenseId={} actorId={} status={}",campaign,e.id(),actor,e.status());return reads.detail(e);
    }
    public ExpenseDto edit(UUID id,UUID actor,PatchRequest r){
        var e=find(id);access.manager(e.campaignId(),actor);access.mutable(campaigns.lockCampaign(e.campaignId()));access.manager(e.campaignId(),actor);e.requireVersion(r.version());
        var clears=r.clearFields()==null?Set.<String>of():r.clearFields();
        if(!Set.of("description","proofReference").containsAll(clears))throw new ApplicationFailure(400,"VALIDATION_ERROR","Only description and proofReference may be cleared");
        if(clears.contains("description")&&r.description()!=null&&!r.description().isBlank())throw new vn.edu.dut.connect.finance.domain.ExpenseViolation("VALIDATION_ERROR","Cannot set and clear description together","description");
        if(clears.contains("proofReference")&&r.proofReference()!=null&&!r.proofReference().isBlank())throw new vn.edu.dut.connect.finance.domain.ExpenseViolation("VALIDATION_ERROR","Cannot set and clear proof reference together","proofReference");
        e.edit(r.title()==null?e.title():r.title(),r.category()==null?e.category():r.category(),r.amount()==null?e.amount():r.amount(),r.expenseDate()==null?e.expenseDate():r.expenseDate(),clears.contains("description")?null:r.description()==null?e.description():r.description(),clears.contains("proofReference")?null:r.proofReference()==null?e.proofReference():r.proofReference());
        expenses.save(e);log.info("Expense edited: campaignId={} expenseId={} actorId={} status={}",e.campaignId(),id,actor,e.status());return reads.detail(e);
    }
    public ExpenseDto approve(UUID id,UUID actor,long version){access.admin(actor);var e=find(id);e.requireVersion(version);e.approve(actor);return reviewed(e,actor);}
    public ExpenseDto reject(UUID id,UUID actor,RejectRequest r){access.admin(actor);var e=find(id);e.requireVersion(r.version());e.reject(actor,r.reason());return reviewed(e,actor);}
    private ExpenseDto reviewed(Expense e,UUID actor){expenses.save(e);log.info("Expense reviewed: campaignId={} expenseId={} actorId={} status={}",e.campaignId(),e.id(),actor,e.status());return reads.detail(e);}
    private Expense find(UUID id){return expenses.find(id).orElseThrow(()->ApplicationFailure.missing("Expense not found"));}
}
