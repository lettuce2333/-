"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@zuoye/database");
let CartService = class CartService {
    async getCart(userId, guestId) {
        const where = {};
        if (userId)
            where.userId = userId;
        else if (guestId)
            where.guestId = guestId;
        else
            return [];
        const items = await database_1.default.cartItem.findMany({ where, orderBy: { id: 'desc' } });
        for (const item of items) {
            item.product = await database_1.default.product.findUnique({ where: { id: item.productId } });
            item.sku = await database_1.default.productSku.findUnique({ where: { id: item.skuId } });
        }
        return items;
    }
    async addItem(userId, guestId, data) {
        const sku = await database_1.default.productSku.findUnique({ where: { id: data.skuId } });
        if (!sku)
            throw new common_1.NotFoundException('SKU不存在');
        const existing = await database_1.default.cartItem.findFirst({
            where: userId
                ? { userId, skuId: data.skuId }
                : { guestId, skuId: data.skuId },
        });
        if (existing) {
            return database_1.default.cartItem.update({
                where: { id: existing.id },
                data: { quantity: existing.quantity + data.quantity },
            });
        }
        return database_1.default.cartItem.create({
            data: { userId, guestId, productId: data.productId, skuId: data.skuId, quantity: data.quantity },
        });
    }
    async updateQuantity(id, quantity, userId, guestId) {
        const where = { id };
        if (userId)
            where.userId = userId;
        else if (guestId)
            where.guestId = guestId;
        const item = await database_1.default.cartItem.findFirst({ where });
        if (!item)
            throw new common_1.NotFoundException('购物车商品不存在');
        return database_1.default.cartItem.update({ where: { id }, data: { quantity } });
    }
    async removeItem(id, userId, guestId) {
        const where = { id };
        if (userId)
            where.userId = userId;
        else if (guestId)
            where.guestId = guestId;
        const item = await database_1.default.cartItem.findFirst({ where });
        if (!item)
            throw new common_1.NotFoundException('购物车商品不存在');
        await database_1.default.cartItem.delete({ where: { id } });
        return { success: true };
    }
    async mergeGuestCart(guestId, userId) {
        const guestItems = await database_1.default.cartItem.findMany({ where: { guestId } });
        for (const item of guestItems) {
            const existing = await database_1.default.cartItem.findFirst({ where: { userId, skuId: item.skuId } });
            if (existing) {
                await database_1.default.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + item.quantity } });
                await database_1.default.cartItem.delete({ where: { id: item.id } });
            }
            else {
                await database_1.default.cartItem.update({ where: { id: item.id }, data: { userId, guestId: null } });
            }
        }
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)()
], CartService);
//# sourceMappingURL=cart.service.js.map