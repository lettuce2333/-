import { NotificationsService } from '../notifications/notifications.service';
export declare class AfterSalesService {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    apply(userId: number, data: {
        orderId: number;
        type: string;
        reason: string;
        amount: number;
    }): Promise<any>;
    getUserAfterSales(userId: number, page?: number, pageSize?: number): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    getAfterSaleDetail(id: number, userId?: number): Promise<any>;
    getShopAfterSales(shopId: number, query: {
        status?: string;
        page?: number;
        pageSize?: number;
    }): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    shopApprove(afterSaleId: number, shopId: number): Promise<void>;
    shopRefuse(afterSaleId: number, shopId: number, remark?: string): Promise<void>;
    buyerShip(afterSaleId: number, userId: number): Promise<void>;
    shopReceive(afterSaleId: number, shopId: number): Promise<void>;
    adminArbitrate(afterSaleId: number, adminId: number, decision: string, remark?: string): Promise<void>;
    dispute(afterSaleId: number, userId: number): Promise<void>;
    autoApprovePending(): Promise<void>;
    autoReceiveReturned(): Promise<void>;
    private refundOrder;
    private doRefund;
}
