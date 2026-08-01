import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(body: {
        email: string;
        password: string;
        nickname?: string;
        phone?: string;
    }): Promise<{
        accessToken: string;
        user: {
            id: any;
            email: any;
            nickname: any;
            roles: any;
        };
    }>;
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        accessToken: string;
        user: {
            id: any;
            email: any;
            nickname: any;
            roles: any;
        };
    }>;
    getProfile(userId: number): Promise<any>;
}
