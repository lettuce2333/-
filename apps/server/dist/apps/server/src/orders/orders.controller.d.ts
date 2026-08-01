import { OrdersService } from './orders.service';
export declare class OrdersController {
    private ordersService;
    constructor(ordersService: OrdersService);
    create(userId: number, body: any): Promise<any[]>;
    getUserOrders(userId: number, query: any): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    getOrderDetail(id: string, userId: number): Promise<any>;
    pay(id: string, userId: number): Promise<any>;
    cancel(id: string, userId: number, reason?: string): Promise<any>;
    receive(id: string, userId: number): Promise<any>;
    getShopOrders(shopId: number, query: any): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    ship(id: string, shopId: number, body?: {
        company?: string;
        trackingNo?: string;
    }): Promise<any>;
}
