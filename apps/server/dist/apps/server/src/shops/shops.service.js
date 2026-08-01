"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@zuoye/database");
let ShopsService = class ShopsService {
    async getShop(id) {
        const shop = await database_1.default.shop.findUnique({ where: { id } });
        if (!shop)
            throw new common_1.NotFoundException('店铺不存在');
        const owner = await database_1.default.user.findUnique({ where: { id: shop.ownerId } });
        return { ...shop, owner: owner ? { id: owner.id, nickname: owner.nickname } : null };
    }
    async getMyShop(userId) {
        const member = await database_1.default.shopMember.findFirst({
            where: { userId },
            include: { shop: true },
        });
        return member?.shop || null;
    }
    async createShop(userId, data) {
        const existing = await database_1.default.shop.findFirst({ where: { ownerId: userId } });
        if (existing)
            throw new common_1.ConflictException('您已拥有店铺');
        const shop = await database_1.default.shop.create({
            data: { ...data, ownerId: userId, status: 'pending' },
        });
        await database_1.default.shopMember.create({
            data: { shopId: shop.id, userId, role: 'shop_owner' },
        });
        return shop;
    }
    async updateShop(userId, shopId, data) {
        const member = await database_1.default.shopMember.findFirst({ where: { userId, shopId, role: 'shop_owner' } });
        if (!member)
            throw new common_1.ForbiddenException('只有店主可以修改店铺');
        return database_1.default.shop.update({ where: { id: shopId }, data });
    }
    async getMembers(shopId) {
        return database_1.default.shopMember.findMany({
            where: { shopId },
            include: { user: { select: { id: true, nickname: true, email: true } } },
        });
    }
    async addMember(ownerId, shopId, data) {
        const member = await database_1.default.shopMember.findFirst({ where: { userId: ownerId, shopId, role: 'shop_owner' } });
        if (!member)
            throw new common_1.ForbiddenException('只有店主可以添加成员');
        return database_1.default.shopMember.create({ data: { shopId, ...data } });
    }
    async removeMember(ownerId, shopId, memberId) {
        const member = await database_1.default.shopMember.findFirst({ where: { userId: ownerId, shopId, role: 'shop_owner' } });
        if (!member)
            throw new common_1.ForbiddenException('只有店主可以移除成员');
        return database_1.default.shopMember.delete({ where: { id: memberId } });
    }
    async getShopStats(shopId) {
        const [orders, products, afterSales] = await Promise.all([
            database_1.default.order.count({ where: { shopId } }),
            database_1.default.product.count({ where: { shopId } }),
            database_1.default.afterSale.count({ where: { shopId, status: { notIn: ['REFUNDED', 'CLOSED'] } } }),
        ]);
        const revenue = await database_1.default.order.aggregate({
            _sum: { totalAmount: true },
            where: { shopId, status: { notIn: ['CANCELLED', 'PENDING_PAYMENT'] } },
        });
        return { orders, products, afterSales, revenue: revenue._sum.totalAmount || 0 };
    }
    async getLogisticsTemplates(shopId) {
        return database_1.default.logisticsTemplate.findMany({ where: { shopId } });
    }
    async createLogisticsTemplate(shopId, data) {
        return database_1.default.logisticsTemplate.create({ data: { ...data, shopId } });
    }
    async updateLogisticsTemplate(shopId, id, data) {
        return database_1.default.logisticsTemplate.update({ where: { id }, data });
    }
    async deleteLogisticsTemplate(shopId, id) {
        return database_1.default.logisticsTemplate.delete({ where: { id } });
    }
    async getShopByOwner(userId) {
        const mem = await database_1.default.shopMember.findFirst({ where: { userId } });
        if (!mem)
            return null;
        const shop = await database_1.default.shop.findUnique({ where: { id: mem.shopId } });
        if (!shop)
            return null;
        const owner = await database_1.default.user.findUnique({ where: { id: shop.ownerId } });
        return { ...shop, owner: owner ? { id: owner.id, nickname: owner.nickname } : null };
    }
};
exports.ShopsService = ShopsService;
exports.ShopsService = ShopsService = __decorate([
    (0, common_1.Injectable)()
], ShopsService);
//# sourceMappingURL=shops.service.js.map