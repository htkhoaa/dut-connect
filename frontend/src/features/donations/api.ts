import {apiClient} from '../../shared/api/client';
import type {PageResponse} from '../../shared/api/errors';
import type {Donation, Creation, Payment, DonationSettings} from './types';

export async function settings() {
    return (await apiClient.get<DonationSettings>('/donation-settings')).data;
}

export async function create(campaignId: string, amount: string) {
    return (await apiClient.post<Creation>('/campaigns/' + campaignId + '/donations', {amount})).data;
}

export async function detail(id: string) {
    return (await apiClient.get<Donation>('/donations/' + id)).data;
}

export async function mine(page: number) {
    return (await apiClient.get<PageResponse<Donation>>('/me/donations', {params: {page, size: 20}})).data;
}

export async function refresh(paymentId: string) {
    return (await apiClient.post<Donation>('/payments/' + paymentId + '/refresh')).data;
}

export async function mockCheckout(paymentId: string) {
    return (await apiClient.get<Payment>('/dev/mock-payments/' + paymentId)).data;
}

export async function simulate(paymentId: string, outcome: 'success' | 'fail') {
    return (await apiClient.post<Donation>('/dev/mock-payments/' + paymentId + '/' + outcome)).data;
}
