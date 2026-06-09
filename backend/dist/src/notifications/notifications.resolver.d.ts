import { NotificationsService } from './notifications.service';
export declare class NotificationEntity {
    id: string;
    userId: string;
    title: string;
    message: string;
    type?: string;
    link?: string;
    isRead: boolean;
    createdAt: Date;
}
export declare class NotificationsResolver {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    myNotifications(userId: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        link: string | null;
        userId: string;
        type: string | null;
        message: string;
        isRead: boolean;
    }[]>;
    unreadNotificationsCount(userId: string): Promise<number>;
    markNotificationRead(id: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        link: string | null;
        userId: string;
        type: string | null;
        message: string;
        isRead: boolean;
    }>;
    markAllNotificationsRead(userId: string): Promise<boolean>;
    createNotification(userId: string, title: string, message: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        link: string | null;
        userId: string;
        type: string | null;
        message: string;
        isRead: boolean;
    }>;
}
