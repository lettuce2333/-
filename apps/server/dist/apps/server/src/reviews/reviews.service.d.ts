export declare class ReviewsService {
    getProductReviews(productId: number, page?: number, pageSize?: number): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    createReview(userId: number, data: {
        productId: number;
        orderId: number;
        rating: number;
        content: string;
        images?: string[];
        isAnonymous?: boolean;
    }): Promise<any>;
    replyReview(shopId: number, reviewId: number, content: string): Promise<any>;
    getUserReviews(userId: number, page?: number, pageSize?: number): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    getShopReviews(shopId: number, page?: number, pageSize?: number): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
}
