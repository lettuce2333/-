import { AfterSalesService } from './after-sales.service';
export declare class AfterSalesController {
    private afterSalesService;
    constructor(afterSalesService: AfterSalesService);
    apply(userId: number, body: any): Promise<any>;
    getUserAfterSales(userId: number, query: any): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    getDetail(id: string, userId: number): Promise<any>;
    dispute(id: string, userId: number): Promise<void>;
    buyerShip(id: string, userId: number): Promise<void>;
    getShopAfterSales(shopId: number, query: any): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    approve(id: string, shopId: number): Promise<void>;
    refuse(id: string, shopId: number, remark?: string): Promise<void>;
    receive(id: string, shopId: number): Promise<void>;
}
