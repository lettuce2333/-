import { CartService } from './cart.service';
export declare class CartController {
    private cartService;
    constructor(cartService: CartService);
    getCart(userId: number, guestId?: string): Promise<any>;
    addItem(userId: number | undefined, body: any): Promise<any>;
    updateQuantity(userId: number, id: string, quantity: number): Promise<any>;
    removeItem(userId: number, id: string): Promise<{
        success: boolean;
    }>;
    mergeCart(userId: number, guestId: string): Promise<void>;
}
