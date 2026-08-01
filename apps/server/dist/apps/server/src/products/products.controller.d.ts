import { ProductsService } from './products.service';
export declare class ProductsController {
    private productsService;
    constructor(productsService: ProductsService);
    findAll(query: any): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    findOne(id: string): Promise<any>;
    getShopProducts(shopId: number, query: any): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    create(userId: number, shopId: number, body: any): Promise<any>;
    update(userId: number, shopId: number, id: string, body: any): Promise<any>;
    submit(userId: number, shopId: number, id: string): Promise<any>;
}
