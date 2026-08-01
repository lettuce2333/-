import { ReviewsService } from './reviews.service';
export declare class ReviewsController {
    private reviewsService;
    constructor(reviewsService: ReviewsService);
    getProductReviews(productId: string, query: any): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    create(userId: number, body: any): Promise<any>;
    getUserReviews(userId: number, query: any): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    getShopReviews(shopId: number, query: any): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    reply(shopId: number, id: string, content: string): Promise<any>;
}
