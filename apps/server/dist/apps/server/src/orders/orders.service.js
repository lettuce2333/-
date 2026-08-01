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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@zuoye/database");
const notifications_service_1 = require("../notifications/notifications.service");
let OrdersService = class OrdersService {
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    async create(userId, data) {
        const address = await database_1.default.address.findFirst({ where: { id: data.addressId, userId } });
        if (!address)
            throw new common_1.NotFoundException('地址不存在');
        const shopGroups = new Map();
        for (const item of data.items) {
            const sku = await database_1.default.productSku.findUnique({ where: { id: item.skuId } });
            if (!sku)
                throw new common_1.NotFoundException(`SKU ${item.skuId} 不存在`);
            const product = await database_1.default.product.findUnique({ where: { id: sku.productId } });
            if (!product)
                throw new common_1.NotFoundException(`商品不存在`);
            if (sku.stock < item.quantity)
                throw new common_1.BadRequestException(`${product.name} 库存不足`);
            if (product.status !== 'active')
                throw new common_1.BadRequestException(`${product.name} 已下架`);
            const shopId = product.shopId;
            if (!shopGroups.has(shopId))
                shopGroups.set(shopId, []);
            shopGroups.get(shopId).push({ sku, product, quantity: item.quantity });
        }
        const orders = [];
        for (const [shopId, items] of shopGroups) {
            const orderNo = `ORD${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
            const totalAmount = items.reduce((sum, i) => sum + i.sku.price * i.quantity, 0);
            for (const item of items) {
                const newStock = item.sku.stock - item.quantity;
                if (newStock < 0)
                    throw new common_1.BadRequestException(`${item.product.name} 库存不足`);
                await database_1.default.productSku.update({ where: { id: item.sku.id }, data: { stock: newStock } });
                await database_1.default.product.update({ where: { id: item.product.id }, data: { sales: (item.product.sales || 0) + item.quantity } });
            }
            const order = await database_1.default.order.create({
                data: {
                    orderNo, userId, shopId, totalAmount,
                    receiverName: address.receiver,
                    receiverPhone: address.phone,
                    receiverAddress: `${address.province}${address.city}${address.district}${address.detail}`,
                },
            });
            for (const i of items) {
                let image = null;
                try {
                    const imgs = JSON.parse(i.product.images || '[]');
                    image = imgs[0] || null;
                }
                catch { }
                await database_1.default.orderItem.create({
                    data: { orderId: order.id, productId: i.product.id, skuId: i.sku.id, productName: i.product.name, skuSpecs: i.sku.specs, quantity: i.quantity, unitPrice: i.sku.price, subtotal: i.sku.price * i.quantity, image },
                });
            }
            await database_1.default.orderStatusLog.create({ data: { orderId: order.id, fromStatus: null, toStatus: 'PENDING_PAYMENT', operator: 'system', remark: '订单创建' } });
            order.items = await database_1.default.orderItem.findMany({ where: { orderId: order.id } });
            orders.push(order);
        }
        const orderedSkuIds = data.items.map(i => i.skuId);
        for (const skuId of orderedSkuIds) {
            await database_1.default.cartItem.deleteMany({ where: { userId, skuId } });
        }
        return orders;
    }
    async getUserOrders(userId, query) {
        const page = query.page || 1;
        const pageSize = query.pageSize || 10;
        const where = { userId };
        if (query.status)
            where.status = query.status;
        const [data, total] = await Promise.all([
            database_1.default.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    items: { include: { product: { select: { id: true, name: true } } } },
                    shop: { select: { id: true, name: true } },
                    logistics: true,
                    payments: true,
                },
            }),
            database_1.default.order.count({ where }),
        ]);
        return { data, total, page, pageSize };
    }
    async getOrderDetail(orderId, userId) {
        const where = { id: orderId };
        if (userId)
            where.userId = userId;
        const order = await database_1.default.order.findFirst({
            where,
            include: {
                items: { include: { product: { select: { id: true, name: true } } } },
                shop: { select: { id: true, name: true } },
                logistics: true,
                payments: true,
                statusLogs: { orderBy: { createdAt: 'asc' } },
                afterSales: true,
            },
        });
        if (!order)
            throw new common_1.NotFoundException('订单不存在');
        return order;
    }
    async pay(orderId, userId) {
        const order = await database_1.default.order.findFirst({ where: { id: orderId, userId } });
        if (!order)
            throw new common_1.NotFoundException('订单不存在');
        if (order.status !== 'PENDING_PAYMENT')
            throw new common_1.BadRequestException('订单状态不允许支付');
        await database_1.default.payment.create({ data: { orderId, amount: order.totalAmount, method: 'mock_wallet' } });
        await database_1.default.order.update({ where: { id: orderId }, data: { status: 'PAID', paidAt: new Date().toISOString() } });
        await database_1.default.orderStatusLog.create({ data: { orderId, fromStatus: 'PENDING_PAYMENT', toStatus: 'PAID', operator: 'user', remark: '支付成功' } });
        return database_1.default.order.findUnique({ where: { id: orderId } });
    }
    async cancel(orderId, userId, reason) {
        const order = await database_1.default.order.findFirst({ where: { id: orderId, userId } });
        if (!order)
            throw new common_1.NotFoundException('订单不存在');
        if (order.status !== 'PENDING_PAYMENT' && order.status !== 'PAID') {
            throw new common_1.BadRequestException('当前状态不允许取消');
        }
        return database_1.default.$transaction(async (tx) => {
            await tx.order.update({ where: { id: orderId }, data: { status: 'CANCELLED', cancelReason: reason } });
            const items = await tx.orderItem.findMany({ where: { orderId } });
            for (const item of items) {
                await tx.productSku.update({ where: { id: item.skuId }, data: { stock: { increment: item.quantity } } });
                await tx.product.update({ where: { id: item.productId }, data: { sales: { decrement: item.quantity } } });
            }
            await tx.orderStatusLog.create({
                data: { orderId, fromStatus: order.status, toStatus: 'CANCELLED', operator: 'user', remark: reason || '用户取消' },
            });
        });
    }
    async ship(orderId, shopId, company, trackingNo) {
        const order = await database_1.default.order.findFirst({ where: { id: orderId, shopId } });
        if (!order)
            throw new common_1.NotFoundException('订单不存在');
        if (order.status !== 'PAID')
            throw new common_1.BadRequestException('订单未付款');
        const courier = company || '顺丰速运';
        const trackNo = trackingNo || `SF${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        await database_1.default.order.update({ where: { id: orderId }, data: { status: 'SHIPPED', shippedAt: new Date().toISOString() } });
        await database_1.default.logistics.create({ data: { orderId, company: courier, trackingNo: trackNo, status: 'shipped', shippedAt: new Date().toISOString() } });
        await database_1.default.orderStatusLog.create({ data: { orderId, fromStatus: 'PAID', toStatus: 'SHIPPED', operator: 'shop', remark: `发货，${courier}: ${trackNo}` } });
        return database_1.default.order.findUnique({ where: { id: orderId } });
    }
    async receive(orderId, userId) {
        const order = await database_1.default.order.findFirst({ where: { id: orderId, userId } });
        if (!order)
            throw new common_1.NotFoundException('订单不存在');
        if (order.status !== 'SHIPPED' && order.status !== 'DELIVERED')
            throw new common_1.BadRequestException('订单未发货');
        return database_1.default.$transaction(async (tx) => {
            await tx.order.update({ where: { id: orderId }, data: { status: 'RECEIVED', receivedAt: new Date() } });
            await tx.orderStatusLog.create({
                data: { orderId, fromStatus: order.status, toStatus: 'RECEIVED', operator: 'user', remark: '用户确认收货' },
            });
        });
    }
    async getShopOrders(shopId, query) {
        const page = query.page || 1;
        const pageSize = query.pageSize || 10;
        const where = { shopId };
        if (query.status)
            where.status = query.status;
        const [data, total] = await Promise.all([
            database_1.default.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    items: true,
                    logistics: true,
                    payments: true,
                },
            }),
            database_1.default.order.count({ where }),
        ]);
        return { data, total, page, pageSize };
    }
    async autoCancelExpiredOrders() {
        const deadline = new Date(Date.now() - 30 * 60 * 1000);
        const expired = await database_1.default.order.findMany({
            where: { status: 'PENDING_PAYMENT', createdAt: { lte: deadline } },
        });
        for (const order of expired) {
            try {
                await database_1.default.$transaction(async (tx) => {
                    await tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED', cancelReason: '超时未支付' } });
                    const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
                    for (const item of items) {
                        await tx.productSku.update({ where: { id: item.skuId }, data: { stock: { increment: item.quantity } } });
                    }
                    await tx.orderStatusLog.create({
                        data: { orderId: order.id, fromStatus: 'PENDING_PAYMENT', toStatus: 'CANCELLED', operator: 'system', remark: '超时未支付自动取消' },
                    });
                });
                await this.notificationsService.create(order.userId, 'order', '订单已取消', `订单 ${order.orderNo} 因超时未支付已自动取消`);
            }
            catch (e) {
                console.error(`Auto-cancel failed for order ${order.id}:`, e);
            }
        }
    }
    async autoCompleteOrders() {
        const deadline = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
        const toComplete = await database_1.default.order.findMany({
            where: { status: 'RECEIVED', receivedAt: { lte: deadline } },
        });
        for (const order of toComplete) {
            await database_1.default.order.update({ where: { id: order.id }, data: { status: 'COMPLETED', completedAt: new Date() } });
        }
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map