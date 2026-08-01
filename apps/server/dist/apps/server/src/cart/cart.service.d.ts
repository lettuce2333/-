export declare class CartService {
    getCart(userId?: number, guestId?: string): Promise<any>;
    addItem(userId: number | undefined, guestId: string | undefined, data: {
        productId: number;
        skuId: number;
        quantity: number;
    }): Promise<any>;
    updateQuantity(id: number, quantity: number, userId?: number, guestId?: string): Promise<any>;
    removeItem(id: number, userId?: number, guestId?: string): Promise<{
        success: boolean;
    }>;
    mergeGuestCart(guestId: string, userId: number): Promise<void>;
}
