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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@zuoye/database");
const schedule_1 = require("@nestjs/schedule");
const orders_service_1 = require("../orders/orders.service");
const after_sales_service_1 = require("../after-sales/after-sales.service");
let AdminService = class AdminService {
    constructor(ordersService, afterSalesService) {
        this.ordersService = ordersService;
        this.afterSalesService = afterSalesService;
    }
    async handleAutoTasks() {
        console.log('[Cron] Running auto tasks...');
        await this.ordersService.autoCancelExpiredOrders();
        await this.ordersService.autoCompleteOrders();
        await this.afterSalesService.autoApprovePending();
        await this.afterSalesService.autoReceiveReturned();
    }
    async getUsers(query) {
        const page = query.page || 1;
        const pageSize = query.pageSize || 20;
        const where = {};
        if (query.keyword) {
            where.OR = [
                { email: { contains: query.keyword } },
                { nickname: { contains: query.keyword } },
                { phone: { contains: query.keyword } },
            ];
        }
        const data = await database_1.default.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        const total = await database_1.default.user.count({ where });
        const dataWithRoles = await Promise.all(data.map(async (u) => {
            const roles = await database_1.default.userRole.findMany({ where: { userId: u.id } });
            return { ...u, roles };
        }));
        return { data: dataWithRoles, total, page, pageSize };
    }
    async toggleUserStatus(userId) {
        const user = await database_1.default.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new Error('用户不存在');
        const newStatus = user.status === 'active' ? 'banned' : 'active';
        return database_1.default.user.update({ where: { id: userId }, data: { status: newStatus } });
    }
    async getShops(query) {
        const page = query.page || 1;
        const pageSize = query.pageSize || 20;
        const where = {};
        if (query.status)
            where.status = query.status;
        const data = await database_1.default.shop.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        const total = await database_1.default.shop.count({ where });
        const dataWithOwner = await Promise.all(data.map(async (s) => {
            const owner = await database_1.default.user.findUnique({ where: { id: s.ownerId } });
            return { ...s, owner: owner ? { id: owner.id, nickname: owner.nickname, email: owner.email } : null };
        }));
        return { data: dataWithOwner, total, page, pageSize };
    }
    async approveShop(shopId) {
        return database_1.default.shop.update({ where: { id: shopId }, data: { status: 'active' } });
    }
    async rejectShop(shopId) {
        return database_1.default.shop.update({ where: { id: shopId }, data: { status: 'rejected' } });
    }
    async getProductsForReview(query) {
        const page = query.page || 1;
        const pageSize = query.pageSize || 20;
        const where = {};
        if (query.status)
            where.status = query.status;
        const [data, total] = await Promise.all([
            database_1.default.product.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: { shop: { select: { id: true, name: true } }, category: { select: { name: true } } },
            }),
            database_1.default.product.count({ where }),
        ]);
        return { data, total, page, pageSize };
    }
    async reviewProduct(productId, action) {
        if (action === 'approve')
            return database_1.default.product.update({ where: { id: productId }, data: { status: 'active' } });
        return database_1.default.product.update({ where: { id: productId }, data: { status: 'rejected' } });
    }
    async createCategory(data) {
        const level = data.parentId ? 2 : 1;
        return database_1.default.category.create({ data: { name: data.name, parentId: data.parentId, level, sort: data.sort || 0 } });
    }
    async updateCategory(id, data) {
        return database_1.default.category.update({ where: { id }, data });
    }
    async deleteCategory(id) {
        await database_1.default.product.updateMany({ where: { categoryId: id }, data: { categoryId: 1 } });
        await database_1.default.category.updateMany({ where: { parentId: id }, data: { parentId: null } });
        return database_1.default.category.delete({ where: { id } });
    }
    async getOrders(query) {
        const page = query.page || 1;
        const pageSize = query.pageSize || 20;
        const where = {};
        if (query.status)
            where.status = query.status;
        const [data, total] = await Promise.all([
            database_1.default.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    shop: { select: { id: true, name: true } },
                    user: { select: { id: true, nickname: true, email: true } },
                    items: { take: 3 },
                },
            }),
            database_1.default.order.count({ where }),
        ]);
        return { data, total, page, pageSize };
    }
    async getPendingArbitrations(page = 1, pageSize = 20) {
        const [data, total] = await Promise.all([
            database_1.default.afterSale.findMany({
                where: { status: 'DISPUTE' },
                orderBy: { appliedAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    order: { select: { orderNo: true } },
                    user: { select: { nickname: true } },
                    shop: { select: { name: true } },
                    logs: { orderBy: { createdAt: 'desc' }, take: 5 },
                },
            }),
            database_1.default.afterSale.count({ where: { status: 'DISPUTE' } }),
        ]);
        return { data, total, page, pageSize };
    }
    async getStats() {
        const [userCount, shopCount, productCount, orderCount, revenue] = await Promise.all([
            database_1.default.user.count(),
            database_1.default.shop.count(),
            database_1.default.product.count({ where: { status: 'active' } }),
            database_1.default.order.count(),
            database_1.default.order.aggregate({ _sum: { totalAmount: true }, where: { status: { notIn: ['CANCELLED', 'PENDING_PAYMENT'] } } }),
        ]);
        return { userCount, shopCount, productCount, orderCount, revenue: revenue._sum.totalAmount || 0 };
    }
};
exports.AdminService = AdminService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminService.prototype, "handleAutoTasks", null);
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [orders_service_1.OrdersService,
        after_sales_service_1.AfterSalesService])
], AdminService);
//# sourceMappingURL=admin.service.js.map