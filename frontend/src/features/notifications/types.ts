export interface AppNotification {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    entityType?: string;
    entityId?: string;
    isRead: boolean;
    createdAt: string;
}

export interface NotificationPage {
    content: AppNotification[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}
