import { OrdersService } from '../orders/orders.service';
import { AfterSalesService } from '../after-sales/after-sales.service';
export declare class AdminService {
    private ordersService;
    private afterSalesService;
    constructor(ordersService: OrdersService, afterSalesService: AfterSalesService);
    handleAutoTasks(): Promise<void>;
    getUsers(query: {
        keyword?: string;
        page?: number;
        pageSize?: number;
    }): Promise<{
        data: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    toggleUserStatus(userId: number): Promise<any>;
    getShops(query: {
        status?: string;
        page?: number;
        pageSize?: number;
    }): Promise<{
        data: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    approveShop(shopId: number): Promise<any>;
    rejectShop(shopId: number): Promise<any>;
    getProductsForReview(query: {
        status?: string;
        page?: number;
        pageSize?: number;
    }): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    reviewProduct(productId: number, action: string): Promise<any>;
    createCategory(data: {
        name: string;
        parentId?: number;
        sort?: number;
    }): Promise<any>;
    updateCategory(id: number, data: {
        name?: string;
        sort?: number;
    }): Promise<any>;
    deleteCategory(id: number): Promise<any>;
    getOrders(query: {
        status?: string;
        page?: number;
        pageSize?: number;
    }): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    getPendingArbitrations(page?: number, pageSize?: number): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    getStats(): Promise<{
        userCount: any;
        shopCount: any;
        productCount: any;
        orderCount: any;
        revenue: any;
    }>;
}
