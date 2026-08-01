"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavoritesService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@zuoye/database");
let FavoritesService = class FavoritesService {
    async getUserFavorites(userId, page = 1, pageSize = 20) {
        const [data, total] = await Promise.all([
            database_1.default.favorite.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            database_1.default.favorite.count({ where: { userId } }),
        ]);
        for (const fav of data) {
            fav.product = await database_1.default.product.findUnique({ where: { id: fav.productId } });
        }
        return { data, total, page, pageSize };
    }
    async toggleFavorite(userId, productId) {
        const existing = await database_1.default.favorite.findFirst({ where: { userId, productId } });
        if (existing) {
            await database_1.default.favorite.delete({ where: { id: existing.id } });
            return { favorited: false };
        }
        await database_1.default.favorite.create({ data: { userId, productId } });
        return { favorited: true };
    }
    async checkFavorite(userId, productId) {
        const existing = await database_1.default.favorite.findFirst({ where: { userId, productId } });
        return { favorited: !!existing };
    }
};
exports.FavoritesService = FavoritesService;
exports.FavoritesService = FavoritesService = __decorate([
    (0, common_1.Injectable)()
], FavoritesService);
//# sourceMappingURL=favorites.service.js.map