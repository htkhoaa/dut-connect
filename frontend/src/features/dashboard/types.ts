import type {FinancialSummary} from '../finance/types';
export interface AdminDashboard {
    activeCampaigns:number;completedCampaigns:number;pendingProposals:number;
    pendingOrganizationVerifications:number;verifiedOrganizations:number;uniqueAcceptedVolunteers:number;
    verifiedVolunteerHours:string;successfulDonationVolume:string;activeFundraisingCampaigns:number;pendingExpenses:number;
}
export interface CampaignDashboard {
    campaignId:string;
    operations:{applications:Record<'TOTAL'|'PENDING'|'ACCEPTED'|'REJECTED'|'CANCELLED',number>;
        assignedTracks:Record<'TECHNICAL'|'LOGISTICS',number>;tasks:Record<'TODO'|'IN_PROGRESS'|'DONE'|'VERIFIED',number>;
        attendanceSessionCount:number;verifiedCompletionCount:number;verifiedVolunteerHours:string;pendingExpenseCount:number};
    financialSummary:FinancialSummary;
}
