export declare class NotificationsService {
    create(userId: number, type: string, title: string, content?: string, relatedId?: number): Promise<any>;
    getUserNotifications(userId: number, page?: number, pageSize?: number): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    markAsRead(userId: number, id: number): Promise<any>;
    markAllAsRead(userId: number): Promise<any>;
}
