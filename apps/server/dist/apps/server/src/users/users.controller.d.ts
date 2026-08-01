import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getAddresses(userId: number): Promise<any>;
    createAddress(userId: number, body: any): Promise<any>;
    updateAddress(userId: number, id: string, body: any): Promise<any>;
    deleteAddress(userId: number, id: string): Promise<any>;
}
