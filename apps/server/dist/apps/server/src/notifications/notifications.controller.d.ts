import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(userId: number, query: any): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    markAsRead(userId: number, id: string): Promise<any>;
    markAllAsRead(userId: number): Promise<any>;
}
