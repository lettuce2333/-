export declare class UsersService {
    getAddresses(userId: number): Promise<any>;
    createAddress(userId: number, data: any): Promise<any>;
    updateAddress(userId: number, addressId: number, data: any): Promise<any>;
    deleteAddress(userId: number, addressId: number): Promise<any>;
}
