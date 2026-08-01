import { FavoritesService } from './favorites.service';
export declare class FavoritesController {
    private favoritesService;
    constructor(favoritesService: FavoritesService);
    getUserFavorites(userId: number, query: any): Promise<{
        data: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    toggleFavorite(userId: number, productId: string): Promise<{
        favorited: boolean;
    }>;
    checkFavorite(userId: number, productId: string): Promise<{
        favorited: boolean;
    }>;
}
