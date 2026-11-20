import { apiClient } from '../../shared/api/client';
import type { NotificationPage } from './types';

export async function getNotifications(page = 0, size = 10) {
    return (await apiClient.get<NotificationPage>('/notifications', { params: { page, size } }))
        .data;
}

export async function getUnreadCount() {
    return (await apiClient.get<{ count: number }>('/notifications/unread-count')).data;
}

export async function getUnreadNotifications(): Promise<NotificationPage> {
    const items: NotificationPage['content'] = [];
    let page = 0;
    let totalPages = 1;
    do {
        const result = await getNotifications(page++, 100);
        items.push(...result.content.filter((item) => !item.isRead));
        totalPages = result.totalPages;
    } while (page < totalPages);
    return {
        content: items,
        totalElements: items.length,
        totalPages: Math.ceil(items.length / 15),
        number: 0,
        size: 15,
    };
}

export async function markAsRead(id: string) {
    return (await apiClient.post(`/notifications/${id}/read`)).data;
}

export async function markAllAsRead() {
    return (await apiClient.post<{ updated: number }>('/notifications/read-all')).data;
}
