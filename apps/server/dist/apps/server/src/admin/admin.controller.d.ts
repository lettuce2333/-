import { AdminService } from './admin.service';
import { AfterSalesService } from '../after-sales/after-sales.service';
export declare class AdminController {
    private adminService;
    private afterSalesService;
    constructor(adminService: AdminService, afterSalesService: AfterSalesService);
    getStats(): Promise<{
        userCount: any;
        shopCount: any;
        productCount: any;
        orderCount: any;
        revenue: any;
    }>;
    getUsers(query: any): Promise<{
        data: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    toggleUserStatus(id: string): Promise<any>;
    getShops(query: any): Promise<{
        data: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    approveShop(id: string): Promise<any>;
    rejectShop(id: string): Promise<any>;
    getProducts(query: any): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    reviewProduct(id: string, action: string): Promise<any>;
    getCategories(): any;
    createCategory(body: any): Promise<any>;
    updateCategory(id: string, body: any): Promise<any>;
    deleteCategory(id: string): Promise<any>;
    getOrders(query: any): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    getPendingArbitrations(query: any): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    arbitrate(id: string, userId: number, body: any): Promise<void>;
}
