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
exports.AfterSalesService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@zuoye/database");
const notifications_service_1 = require("../notifications/notifications.service");
let AfterSalesService = class AfterSalesService {
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    async apply(userId, data) {
        const order = await database_1.default.order.findFirst({ where: { id: data.orderId, userId } });
        if (!order)
            throw new common_1.NotFoundException('订单不存在');
        if (order.status === 'PENDING_PAYMENT' || order.status === 'CANCELLED') {
            throw new common_1.BadRequestException('当前订单状态不支持申请售后');
        }
        const existing = await database_1.default.afterSale.findFirst({
            where: { orderId: data.orderId, status: { notIn: ['REFUNDED', 'CLOSED'] } },
        });
        if (existing)
            throw new common_1.BadRequestException('已有进行中的售后申请');
        if (data.amount > order.totalAmount)
            throw new common_1.BadRequestException('退款金额不能超过订单总额');
        const afterSale = await database_1.default.afterSale.create({
            data: {
                orderId: data.orderId,
                userId,
                shopId: order.shopId,
                type: data.type,
                reason: data.reason,
                amount: data.amount,
                logs: { create: { operator: 'user', action: 'apply', remark: data.reason } },
            },
            include: { logs: true },
        });
        await this.notificationsService.create(userId, 'after_sale', '售后申请已提交', `订单 ${order.orderNo} 的售后申请已提交，等待商家处理`, afterSale.id);
        return afterSale;
    }
    async getUserAfterSales(userId, page = 1, pageSize = 10) {
        const [data, total] = await Promise.all([
            database_1.default.afterSale.findMany({
                where: { userId },
                orderBy: { appliedAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    order: { select: { orderNo: true, totalAmount: true } },
                    logs: { orderBy: { createdAt: 'desc' }, take: 3 },
                },
            }),
            database_1.default.afterSale.count({ where: { userId } }),
        ]);
        return { data, total, page, pageSize };
    }
    async getAfterSaleDetail(id, userId) {
        const where = { id };
        if (userId)
            where.userId = userId;
        const afterSale = await database_1.default.afterSale.findFirst({
            where,
            include: {
                order: { select: { orderNo: true, status: true, totalAmount: true } },
                logs: { orderBy: { createdAt: 'asc' } },
            },
        });
        if (!afterSale)
            throw new common_1.NotFoundException('售后记录不存在');
        return afterSale;
    }
    async getShopAfterSales(shopId, query) {
        const page = query.page || 1;
        const pageSize = query.pageSize || 10;
        const where = { shopId };
        if (query.status)
            where.status = query.status;
        const [data, total] = await Promise.all([
            database_1.default.afterSale.findMany({
                where,
                orderBy: { appliedAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    order: { select: { orderNo: true } },
                    user: { select: { id: true, nickname: true } },
                    logs: { orderBy: { createdAt: 'desc' }, take: 3 },
                },
            }),
            database_1.default.afterSale.count({ where }),
        ]);
        return { data, total, page, pageSize };
    }
    async shopApprove(afterSaleId, shopId) {
        const as = await database_1.default.afterSale.findFirst({ where: { id: afterSaleId, shopId, status: 'PENDING' } });
        if (!as)
            throw new common_1.NotFoundException('售后申请不存在');
        const updates = { status: 'SHOP_APPROVED' };
        const logAction = 'approve';
        if (as.type === 'refund_only') {
            updates.status = 'REFUNDED';
            updates.resolvedAt = new Date();
        }
        else {
            updates.status = 'WAITING_RETURN';
        }
        await database_1.default.afterSale.update({ where: { id: afterSaleId }, data: updates });
        await database_1.default.afterSaleLog.create({ data: { afterSaleId, operator: 'shop_owner', action: logAction, remark: '商家同意售后' } });
        if (updates.status === 'REFUNDED') {
            await this.refundOrder(as.orderId);
        }
        await this.notificationsService.create(as.userId, 'after_sale', '商家已同意售后', `售后申请已通过`, afterSaleId);
    }
    async shopRefuse(afterSaleId, shopId, remark) {
        const as = await database_1.default.afterSale.findFirst({ where: { id: afterSaleId, shopId, status: 'PENDING' } });
        if (!as)
            throw new common_1.NotFoundException('售后申请不存在');
        await database_1.default.afterSale.update({ where: { id: afterSaleId }, data: { status: 'SHOP_REFUSED' } });
        await database_1.default.afterSaleLog.create({ data: { afterSaleId, operator: 'shop_owner', action: 'refuse', remark: remark || '商家拒绝售后' } });
        await this.notificationsService.create(as.userId, 'after_sale', '商家拒绝了售后', `拒绝原因: ${remark || '无'}`, afterSaleId);
    }
    async buyerShip(afterSaleId, userId) {
        const as = await database_1.default.afterSale.findFirst({ where: { id: afterSaleId, userId, status: 'WAITING_RETURN' } });
        if (!as)
            throw new common_1.NotFoundException('售后申请不存在或状态不正确');
        await database_1.default.afterSale.update({ where: { id: afterSaleId }, data: { status: 'BUYER_SHIPPED' } });
        await database_1.default.afterSaleLog.create({ data: { afterSaleId, operator: 'user', action: 'ship', remark: '用户已寄回商品' } });
        await this.notificationsService.create(as.userId, 'after_sale', '商品已寄回', '等待商家确认收货', afterSaleId);
    }
    async shopReceive(afterSaleId, shopId) {
        const as = await database_1.default.afterSale.findFirst({ where: { id: afterSaleId, shopId, status: 'BUYER_SHIPPED' } });
        if (!as)
            throw new common_1.NotFoundException('售后申请不存在');
        await database_1.default.afterSale.update({ where: { id: afterSaleId }, data: { status: 'SHOP_RECEIVED' } });
        await database_1.default.afterSaleLog.create({ data: { afterSaleId, operator: 'shop_owner', action: 'receive', remark: '商家已确认收货' } });
        await this.doRefund(afterSaleId);
    }
    async adminArbitrate(afterSaleId, adminId, decision, remark) {
        const as = await database_1.default.afterSale.findUnique({ where: { id: afterSaleId } });
        if (!as || as.status !== 'DISPUTE')
            throw new common_1.BadRequestException('售后申请状态不正确');
        let newStatus;
        let logAction;
        switch (decision) {
            case 'refund':
                newStatus = 'ADMIN_REFUND';
                logAction = 'resolve';
                break;
            case 'reject':
                newStatus = 'ADMIN_REJECT';
                logAction = 'resolve';
                break;
            case 'partial':
                newStatus = 'ADMIN_PARTIAL';
                logAction = 'resolve';
                break;
            default:
                throw new common_1.BadRequestException('无效的仲裁决定');
        }
        await database_1.default.afterSale.update({ where: { id: afterSaleId }, data: { status: newStatus, resolvedAt: new Date() } });
        await database_1.default.afterSaleLog.create({ data: { afterSaleId, operator: 'admin', action: logAction, remark: remark || `管理员仲裁: ${decision}` } });
        if (newStatus === 'ADMIN_REFUND' || newStatus === 'ADMIN_PARTIAL') {
            await this.refundOrder(as.orderId);
        }
    }
    async dispute(afterSaleId, userId) {
        const as = await database_1.default.afterSale.findFirst({ where: { id: afterSaleId, userId, status: 'SHOP_REFUSED' } });
        if (!as)
            throw new common_1.BadRequestException('无法申诉');
        await database_1.default.afterSale.update({ where: { id: afterSaleId }, data: { status: 'DISPUTE' } });
        await database_1.default.afterSaleLog.create({ data: { afterSaleId, operator: 'user', action: 'arbitrate', remark: '用户发起申诉，等待管理员介入' } });
    }
    async autoApprovePending() {
        const deadline = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const pending = await database_1.default.afterSale.findMany({ where: { status: 'PENDING', appliedAt: { lte: deadline } } });
        for (const as of pending) {
            try {
                if (as.type === 'refund_only') {
                    await database_1.default.afterSale.update({ where: { id: as.id }, data: { status: 'AUTO_APPROVED', autoApprovedAt: new Date() } });
                    await this.refundOrder(as.orderId);
                }
                else {
                    await database_1.default.afterSale.update({ where: { id: as.id }, data: { status: 'AUTO_APPROVED', autoApprovedAt: new Date() } });
                }
                await database_1.default.afterSaleLog.create({ data: { afterSaleId: as.id, operator: 'system', action: 'resolve', remark: '商家超时未处理，系统自动同意' } });
                await this.notificationsService.create(as.userId, 'after_sale', '售后申请已自动同意', '商家超时未处理，系统已自动同意您的售后申请', as.id);
            }
            catch (e) {
                console.error(`Auto-approve failed for after-sale ${as.id}:`, e);
            }
        }
    }
    async autoReceiveReturned() {
        const deadline = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
        const shipped = await database_1.default.afterSale.findMany({ where: { status: 'BUYER_SHIPPED', appliedAt: { lte: deadline } } });
        for (const as of shipped) {
            try {
                await database_1.default.afterSale.update({ where: { id: as.id }, data: { status: 'AUTO_RECEIVED' } });
                await this.doRefund(as.id);
                await database_1.default.afterSaleLog.create({ data: { afterSaleId: as.id, operator: 'system', action: 'receive', remark: '商家超时未确认收货，系统自动确认' } });
            }
            catch (e) {
                console.error(`Auto-receive failed for after-sale ${as.id}:`, e);
            }
        }
    }
    async refundOrder(orderId) {
        await database_1.default.order.update({ where: { id: orderId }, data: { status: 'REFUNDED' } });
    }
    async doRefund(afterSaleId) {
        const as = await database_1.default.afterSale.findUnique({ where: { id: afterSaleId } });
        if (!as)
            return;
        await database_1.default.afterSale.update({ where: { id: afterSaleId }, data: { status: 'REFUNDED', resolvedAt: new Date() } });
        await this.refundOrder(as.orderId);
    }
};
exports.AfterSalesService = AfterSalesService;
exports.AfterSalesService = AfterSalesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], AfterSalesService);
//# sourceMappingURL=after-sales.service.js.map