"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const database_1 = require("@zuoye/database");
let AuthService = class AuthService {
    constructor(jwtService) {
        this.jwtService = jwtService;
    }
    async register(email, password, nickname, phone) {
        const existing = await database_1.default.user.findUnique({ where: { email } });
        if (existing)
            throw new common_1.ConflictException('邮箱已被注册');
        const hashed = await bcrypt.hash(password, 10);
        const user = await database_1.default.user.create({
            data: {
                email,
                password: hashed,
                nickname: nickname || email.split('@')[0],
                phone,
                roles: { create: { role: 'buyer' } },
            },
        });
        const tmpRoles = await database_1.default.userRole.findMany({ where: { userId: user.id } });
        user.roles = tmpRoles;
        return this.generateTokens(user);
    }
    async login(email, password) {
        let user = await database_1.default.user.findUnique({ where: { email } });
        if (!user)
            throw new common_1.UnauthorizedException('邮箱或密码错误');
        if (user.status === 'banned')
            throw new common_1.UnauthorizedException('账号已被封禁');
        const valid = await bcrypt.compare(password, user.password);
        if (!valid)
            throw new common_1.UnauthorizedException('邮箱或密码错误');
        const roles = await database_1.default.userRole.findMany({ where: { userId: user.id } });
        user = { ...user, roles };
        return this.generateTokens(user);
    }
    async getProfile(userId) {
        const [user, roles] = await Promise.all([
            database_1.default.user.findUnique({ where: { id: userId } }),
            database_1.default.userRole.findMany({ where: { userId } }),
        ]);
        if (!user)
            throw new common_1.UnauthorizedException('用户不存在');
        const { password, ...rest } = user;
        return { ...rest, roles };
    }
    generateTokens(user) {
        const roles = user.roles?.map((r) => r.role) || ['buyer'];
        const payload = {
            userId: user.id,
            roles,
            currentRole: roles[0],
        };
        const accessToken = this.jwtService.sign(payload);
        return { accessToken, user: { id: user.id, email: user.email, nickname: user.nickname, roles } };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map