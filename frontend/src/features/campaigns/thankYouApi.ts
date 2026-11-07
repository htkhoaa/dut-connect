import {apiClient} from '../../shared/api/client';

export interface ThankYouRecipient {
    userId: string;
    fullName: string;
    studentId: string;
    email: string;
    contributionType: 'DONATION' | 'VOLUNTEER';
    detail: string;
    emailSent: boolean;
}

export interface CampaignRecipientsSummary {
    campaignId: string;
    campaignTitle: string;
    contributionMode: string;
    donorsCount: number;
    volunteersCount: number;
    donors: ThankYouRecipient[];
    volunteers: ThankYouRecipient[];
}

export interface CampaignThankYouResponse {
    donorsCount: number;
    volunteersCount: number;
    totalSent: number;
    message: string;
    recipients: ThankYouRecipient[];
}

export async function getThankYouRecipients(campaignId: string) {
    return (await apiClient.get<CampaignRecipientsSummary>(`/campaigns/${campaignId}/thank-you/recipients`)).data;
}

export async function sendThankYou(campaignId: string, customSubject?: string, customMessage?: string) {
    return (await apiClient.post<CampaignThankYouResponse>(`/campaigns/${campaignId}/thank-you`, {
        customSubject,
        customMessage
    })).data;
}

export async function getCertificatePreviewSvg(campaignId: string, type: 'DONATION' | 'VOLUNTEER') {
    return (await apiClient.get<{svg: string; type: string}>(`/campaigns/${campaignId}/certificate/preview-data`, {
        params: {type}
    })).data;
}
