import { ShopsService } from './shops.service';
export declare class ShopsController {
    private shopsService;
    constructor(shopsService: ShopsService);
    getShop(id: string): Promise<any>;
    getMyShop(userId: number): Promise<any>;
    createShop(userId: number, body: any): Promise<any>;
    updateShop(userId: number, id: string, body: any): Promise<any>;
    getMembers(id: string): Promise<any>;
    addMember(userId: number, id: string, body: any): Promise<any>;
    getStats(shopId: number): Promise<{
        orders: any;
        products: any;
        afterSales: any;
        revenue: any;
    }>;
    getLogisticsTemplates(shopId: number): Promise<any>;
    createLogisticsTemplate(shopId: number, body: any): Promise<any>;
    updateLogisticsTemplate(shopId: number, id: string, body: any): Promise<any>;
    deleteLogisticsTemplate(shopId: number, id: string): Promise<any>;
    removeMember(userId: number, shopId: string, memberId: string): Promise<any>;
}
