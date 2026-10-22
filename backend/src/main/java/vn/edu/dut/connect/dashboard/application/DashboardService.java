package vn.edu.dut.connect.dashboard.application;

import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import vn.edu.dut.connect.campaign.application.CampaignAccessPort;
import vn.edu.dut.connect.campaign.application.CampaignAuthorization;
import vn.edu.dut.connect.finance.application.FinanceReadService;
import vn.edu.dut.connect.finance.application.FinanceContracts.FinancialSummary;

@Service
@Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
public class DashboardService {
    public record CampaignDashboard(UUID campaignId, DashboardQuery.Campaign operations, FinancialSummary financialSummary) {}
    private final DashboardQuery query;
    private final CampaignAuthorization access;
    private final CampaignAccessPort campaigns;
    private final FinanceReadService finance;
    public DashboardService(DashboardQuery query, CampaignAuthorization access, CampaignAccessPort campaigns, FinanceReadService finance) {
        this.query = query; this.access = access; this.campaigns = campaigns; this.finance = finance;
    }
    public DashboardQuery.Admin admin(UUID actor) { access.admin(actor); return query.admin(); }
    public CampaignDashboard campaign(UUID id, UUID actor) {
        access.manager(id, actor); campaigns.getCampaign(id);
        return new CampaignDashboard(id, query.campaign(id), finance.summary(id, actor));
    }
}
