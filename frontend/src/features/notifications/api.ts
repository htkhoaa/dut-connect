import {apiClient} from '../../shared/api/client';
import type {NotificationPage} from './types';

export async function getNotifications(page = 0, size = 10) {
    return (await apiClient.get<NotificationPage>('/notifications', {params: {page, size}})).data;
}

export async function getUnreadCount() {
    return (await apiClient.get<{count: number}>('/notifications/unread-count')).data;
}

export async function markAsRead(id: string) {
    return (await apiClient.post(`/notifications/${id}/read`)).data;
}

export async function markAllAsRead() {
    return (await apiClient.post<{updated: number}>('/notifications/read-all')).data;
}
