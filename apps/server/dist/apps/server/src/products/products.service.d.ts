export declare class ProductsService {
    findAll(query: {
        categoryId?: number;
        keyword?: string;
        page?: number;
        pageSize?: number;
        sort?: string;
        priceMin?: string;
        priceMax?: string;
    }): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    findOne(id: number): Promise<any>;
    getShopProducts(shopId: number, query: {
        page?: number;
        pageSize?: number;
        status?: string;
    }): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    createProduct(shopId: number, userId: number, data: any): Promise<any>;
    updateProduct(shopId: number, userId: number, productId: number, data: any): Promise<any>;
    submitForReview(shopId: number, userId: number, productId: number): Promise<any>;
}
