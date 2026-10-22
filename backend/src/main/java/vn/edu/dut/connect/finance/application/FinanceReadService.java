package vn.edu.dut.connect.finance.application;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import vn.edu.dut.connect.campaign.application.CampaignAccessPort;
import vn.edu.dut.connect.campaign.domain.CampaignStatus;
import vn.edu.dut.connect.donation.application.DonationFundingPort;
import vn.edu.dut.connect.identity.application.*;
import vn.edu.dut.connect.finance.domain.*;
import vn.edu.dut.connect.shared.application.PageResult;
import static vn.edu.dut.connect.finance.application.FinanceContracts.*;

@Service
@Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
public class FinanceReadService {
    private final ExpenseRepository expenses;
    private final CampaignAccessPort campaigns;
    private final DonationFundingPort donations;
    private final IdentityDirectoryPort identities;
    private final FinanceAuthorization access;
    public FinanceReadService(ExpenseRepository expenses,CampaignAccessPort campaigns,DonationFundingPort donations,IdentityDirectoryPort identities,FinanceAuthorization access){this.expenses=expenses;this.campaigns=campaigns;this.donations=donations;this.identities=identities;this.access=access;}
    public FinancialSummary summary(UUID campaign,UUID actor){
        access.visible(campaigns.getCampaign(campaign),actor);
        var funding=campaigns.funding(campaign);
        var paid=donations.paidFunding(Set.of(campaign)).getOrDefault(campaign,new DonationFundingPort.Funding(BigDecimal.ZERO,0));
        var approved=expenses.approvedAmount(campaign);
        var total=funding.institutional().add(funding.sponsor()).add(paid.amount());
        return new FinancialSummary(campaign,funding.institutional().toPlainString(),funding.sponsor().toPlainString(),paid.amount().toPlainString(),total.toPlainString(),approved.toPlainString(),total.subtract(approved).toPlainString(),funding.goal()==null?null:funding.goal().toPlainString(),paid.count());
    }
    public List<FundraisingProgress> progress(Set<UUID> ids,UUID actor){
        if(ids.isEmpty()||ids.size()>100||ids.stream().anyMatch(Objects::isNull))throw new vn.edu.dut.connect.shared.application.ApplicationFailure(400,"VALIDATION_ERROR","Provide between 1 and 100 valid campaign IDs");
        var found=campaigns.getCampaigns(ids);
        if(found.size()!=ids.size())throw vn.edu.dut.connect.shared.application.ApplicationFailure.missing("Campaign not found");
        access.visible(found.values(),actor);
        var paid=donations.paidFunding(ids);
        return ids.stream().sorted().map(id->{var p=paid.getOrDefault(id,new DonationFundingPort.Funding(BigDecimal.ZERO,0));return new FundraisingProgress(id,p.amount().toPlainString(),p.count());}).toList();
    }
    public PageResult<PublicExpense> approved(UUID campaign,UUID actor,Pagination page){access.visible(campaigns.getCampaign(campaign),actor);return expenses.list(campaign,ExpenseStatus.APPROVED,page).map(PublicExpense::from);}
    public PageResult<ExpenseDto> management(UUID campaign,UUID actor,ExpenseStatus status,Pagination page){campaigns.getCampaign(campaign);access.manager(campaign,actor);return details(expenses.list(campaign,status,page));}
    public PageResult<ExpenseDto> admin(UUID actor,ExpenseStatus status,Pagination page){access.admin(actor);return details(expenses.list(null,status,page));}
    public ExpenseDto detail(Expense e){return details(new PageResult<>(List.of(e),0,1,1,1,false,false)).items().getFirst();}
    private PageResult<ExpenseDto> details(PageResult<Expense> page){
        var userIds=new HashSet<UUID>();page.items().forEach(e->{userIds.add(e.submittedByUserId());if(e.reviewedByUserId()!=null)userIds.add(e.reviewedByUserId());});
        var names=identities.findAccounts(userIds);
        var campaignInfo=campaigns.getCampaigns(page.items().stream().map(Expense::campaignId).collect(Collectors.toSet()));
        return page.map(e->{var c=campaignInfo.get(e.campaignId());return new ExpenseDto(e.id(),e.campaignId(),c.title(),e.title(),e.category(),e.amount().toPlainString(),e.expenseDate(),e.description(),e.proofReference(),e.status(),e.submittedByUserId(),names.get(e.submittedByUserId()).fullName(),e.reviewedByUserId(),e.reviewedByUserId()==null?null:names.get(e.reviewedByUserId()).fullName(),e.reviewedAt(),e.rejectionReason(),e.createdAt(),e.updatedAt(),e.version(),e.status()==ExpenseStatus.PENDING&&c.status()!=CampaignStatus.COMPLETED&&c.status()!=CampaignStatus.CANCELLED);});
    }
}
