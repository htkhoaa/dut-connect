export type DonationStatus = 'CREATED' | 'PENDING_PAYMENT' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'CREATED' | 'PROVIDER_PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface Payment {
    id: string;
    donationId: string;
    amount: string;
    provider: 'mock' | 'zalopay';
    status: PaymentStatus;
    checkoutUrl: string | null;
    providerOrderId: string;
    providerTransactionId: string | null;
    failureReason: string | null;
    expiresAt: string | null;
    paidAt: string | null;
    version: number
}

export interface Donation {
    id: string;
    campaignId: string;
    campaignTitle: string;
    campaignSlug: string;
    amount: string;
    status: DonationStatus;
    createdAt: string;
    updatedAt: string;
    version: number;
    payments: Payment[]
}

export interface Creation {
    donationId: string;
    paymentTransactionId: string;
    status: DonationStatus;
    checkoutUrl: string | null;
    message: string | null
}

export interface DonationSettings {
    provider: string;
    minimumVnd: string;
    maximumVnd: string;
    available: boolean
}

export const donationStatuses = {
    CREATED: {label: 'Chờ xác nhận thanh toán', tone: 'neutral'},
    PENDING_PAYMENT: {label: 'Chờ thanh toán', tone: 'neutral'},
    PAID: {label: 'Đã thanh toán', tone: 'success'},
    FAILED: {label: 'Thất bại', tone: 'danger'},
    CANCELLED: {label: 'Đã hủy', tone: 'neutral'},
    REFUNDED: {label: 'Đã hoàn tiền', tone: 'neutral'}
} as const;
export const paymentStatuses = {
    CREATED: donationStatuses.CREATED,
    PROVIDER_PENDING: donationStatuses.PENDING_PAYMENT,
    PAID: donationStatuses.PAID,
    FAILED: donationStatuses.FAILED,
    CANCELLED: donationStatuses.CANCELLED,
    REFUNDED: donationStatuses.REFUNDED
} as const;
export const validId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export function checkoutLink(url: string | null): string | null {
    if (!url) return null;
    if (/^\/dev\/mock-payments\/[0-9a-f-]{36}$/i.test(url)) return url;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' && !parsed.username && !parsed.password ? parsed.href : null;
    } catch {
        return null;
    }
}
