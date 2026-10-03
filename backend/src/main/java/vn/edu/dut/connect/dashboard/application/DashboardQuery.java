package vn.edu.dut.connect.dashboard.application;

import java.util.Map;
import java.util.UUID;

public interface DashboardQuery {
    record Admin(long activeCampaigns, long completedCampaigns, long pendingProposals,
                 long pendingOrganizationVerifications, long verifiedOrganizations,
                 long uniqueAcceptedVolunteers, String verifiedVolunteerHours,
                 String successfulDonationVolume, long activeFundraisingCampaigns, long pendingExpenses) {}
    record Campaign(Map<String, Long> applications, Map<String, Long> assignedTracks,
                    Map<String, Long> tasks, long attendanceSessionCount,
                    long verifiedCompletionCount, String verifiedVolunteerHours, long pendingExpenseCount) {}
    Admin admin();
    Campaign campaign(UUID id);
}
