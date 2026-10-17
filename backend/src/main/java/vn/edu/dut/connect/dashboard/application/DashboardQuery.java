package vn.edu.dut.connect.dashboard.application;
import java.util.Map;
import java.util.UUID;
public interface DashboardQuery {
 record Admin(long activeCampaigns,long completedCampaigns,long pendingProposals,long pendingOrganizationVerifications,long verifiedOrganizations,long uniqueAcceptedVolunteers) {}
 record Campaign(Map<String,Long> applications,Map<String,Long> assignedTracks,long attendanceSessionCount,long presentAttendanceCount,long meetingCount) {}
 Admin admin();
 Campaign campaign(UUID id);
}
