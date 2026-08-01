import { NotificationsService } from '../notifications/notifications.service';
export declare class OrdersService {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    create(userId: number, data: {
        addressId: number;
        items: {
            skuId: number;
            quantity: number;
        }[];
        remark?: string;
    }): Promise<any[]>;
    getUserOrders(userId: number, query: {
        status?: string;
        page?: number;
        pageSize?: number;
    }): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    getOrderDetail(orderId: number, userId?: number): Promise<any>;
    pay(orderId: number, userId: number): Promise<any>;
    cancel(orderId: number, userId: number, reason?: string): Promise<any>;
    ship(orderId: number, shopId: number, company?: string, trackingNo?: string): Promise<any>;
    receive(orderId: number, userId: number): Promise<any>;
    getShopOrders(shopId: number, query: {
        status?: string;
        page?: number;
        pageSize?: number;
    }): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    autoCancelExpiredOrders(): Promise<void>;
    autoCompleteOrders(): Promise<void>;
}
