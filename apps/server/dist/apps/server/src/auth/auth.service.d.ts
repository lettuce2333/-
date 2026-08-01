import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private jwtService;
    constructor(jwtService: JwtService);
    register(email: string, password: string, nickname?: string, phone?: string): Promise<{
        accessToken: string;
        user: {
            id: any;
            email: any;
            nickname: any;
            roles: any;
        };
    }>;
    login(email: string, password: string): Promise<{
        accessToken: string;
        user: {
            id: any;
            email: any;
            nickname: any;
            roles: any;
        };
    }>;
    getProfile(userId: number): Promise<any>;
    private generateTokens;
}
