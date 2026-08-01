export declare class FavoritesService {
    getUserFavorites(userId: number, page?: number, pageSize?: number): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    toggleFavorite(userId: number, productId: number): Promise<{
        favorited: boolean;
    }>;
    checkFavorite(userId: number, productId: number): Promise<{
        favorited: boolean;
    }>;
}
