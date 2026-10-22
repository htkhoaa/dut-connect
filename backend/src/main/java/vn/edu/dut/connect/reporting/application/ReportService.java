package vn.edu.dut.connect.reporting.application;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import vn.edu.dut.connect.campaign.application.*;
import vn.edu.dut.connect.finance.application.FinanceReadService;
import static vn.edu.dut.connect.reporting.application.ReportQuery.Sheet;

@Service
@Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
public class ReportService {
    private final ReportQuery query;
    private final CampaignAuthorization access;
    private final CampaignAccessPort campaigns;
    private final FinanceReadService finance;
    public ReportService(ReportQuery query, CampaignAuthorization access, CampaignAccessPort campaigns, FinanceReadService finance) {
        this.query = query; this.access = access; this.campaigns = campaigns; this.finance = finance;
    }
    public List<Sheet> volunteers(UUID id, UUID actor) {
        access.manager(id, actor); campaigns.getCampaign(id);
        return List.of(new Sheet("Volunteers", List.of("Full Name", "Student ID", "Faculty", "Campaign", "Assigned Contribution Track", "Application Status", "Present Attendance Sessions", "Total Attendance Sessions", "Completion Status", "Verified Hours", "Verified At"), query.volunteers(id)));
    }
    public List<Sheet> financial(UUID id, UUID actor) {
        access.manager(id, actor); var campaign = campaigns.getCampaign(id); var summary = finance.summary(id, actor);
        return List.of(new Sheet("Summary", List.of("Campaign", "Institutional Funding", "Sponsor", "Sponsor Funding", "Verified Donations", "Total Funding", "Approved Expenses", "Remaining Funds", "Successful Donation Count"),
                List.of(List.of(campaign.title(), summary.institutionalFunding(), query.sponsor(id), summary.sponsorFunding(), summary.verifiedDonations(), summary.totalFunding(), summary.approvedExpenses(), summary.remainingFunds(), Long.toString(summary.successfulDonationCount())))),
            new Sheet("Donations", List.of("Donation ID", "Donor Student ID", "Donor Name", "Amount", "Status", "Paid At", "Payment Provider", "Provider Transaction Reference"), query.donations(id)),
            new Sheet("Expenses", List.of("Expense", "Category", "Amount", "Expense Date", "Status", "Submitted By", "Reviewed By", "Reviewed At"), query.expenses(id)));
    }
}
