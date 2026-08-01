export declare class ShopsService {
    getShop(id: number): Promise<any>;
    getMyShop(userId: number): Promise<any>;
    createShop(userId: number, data: {
        name: string;
        description?: string;
        contactPhone?: string;
    }): Promise<any>;
    updateShop(userId: number, shopId: number, data: any): Promise<any>;
    getMembers(shopId: number): Promise<any>;
    addMember(ownerId: number, shopId: number, data: {
        userId: number;
        role: string;
    }): Promise<any>;
    removeMember(ownerId: number, shopId: number, memberId: number): Promise<any>;
    getShopStats(shopId: number): Promise<{
        orders: any;
        products: any;
        afterSales: any;
        revenue: any;
    }>;
    getLogisticsTemplates(shopId: number): Promise<any>;
    createLogisticsTemplate(shopId: number, data: {
        name: string;
        company: string;
        price: number;
    }): Promise<any>;
    updateLogisticsTemplate(shopId: number, id: number, data: {
        name?: string;
        company?: string;
        price?: number;
    }): Promise<any>;
    deleteLogisticsTemplate(shopId: number, id: number): Promise<any>;
    getShopByOwner(userId: number): Promise<any>;
}
