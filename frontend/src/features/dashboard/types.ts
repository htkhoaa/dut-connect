export interface AdminDashboard {
 activeCampaigns:number;completedCampaigns:number;pendingProposals:number;
 pendingOrganizationVerifications:number;verifiedOrganizations:number;uniqueAcceptedVolunteers:number;
}
export interface CampaignDashboard {
 campaignId:string;
 operations:{applications:Record<'TOTAL'|'PENDING'|'ACCEPTED'|'REJECTED'|'CANCELLED',number>;
 assignedTracks:Record<'TECHNICAL'|'LOGISTICS',number>;
 attendanceSessionCount:number;presentAttendanceCount:number;meetingCount:number};
}
