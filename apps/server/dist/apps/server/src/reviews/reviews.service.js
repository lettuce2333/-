"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@zuoye/database");
let ReviewsService = class ReviewsService {
    async getProductReviews(productId, page = 1, pageSize = 10) {
        const [data, total] = await Promise.all([
            database_1.default.review.findMany({
                where: { productId },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    user: { select: { nickname: true, avatar: true } },
                    replies: { include: { shop: { select: { name: true } } } },
                },
            }),
            database_1.default.review.count({ where: { productId } }),
        ]);
        return { data, total, page, pageSize };
    }
    async createReview(userId, data) {
        const order = await database_1.default.order.findFirst({ where: { id: data.orderId, userId, status: { in: ['RECEIVED', 'COMPLETED'] } } });
        if (!order)
            throw new common_1.BadRequestException('订单不可评价');
        const hasItem = await database_1.default.orderItem.findFirst({ where: { orderId: data.orderId, productId: data.productId } });
        if (!hasItem)
            throw new common_1.BadRequestException('该订单不包含此商品');
        const existing = await database_1.default.review.findUnique({ where: { userId_orderId_productId: { userId, orderId: data.orderId, productId: data.productId } } });
        if (existing)
            throw new common_1.BadRequestException('已评价过该商品');
        if (data.rating < 1 || data.rating > 5)
            throw new common_1.BadRequestException('评分必须在1-5之间');
        return database_1.default.review.create({
            data: {
                userId,
                productId: data.productId,
                orderId: data.orderId,
                rating: data.rating,
                content: data.content,
                images: JSON.stringify(data.images || []),
                isAnonymous: data.isAnonymous || false,
            },
        });
    }
    async replyReview(shopId, reviewId, content) {
        const review = await database_1.default.review.findUnique({ where: { id: reviewId }, include: { product: true } });
        if (!review)
            throw new common_1.NotFoundException('评价不存在');
        if (review.product.shopId !== shopId)
            throw new common_1.ForbiddenException('无权回复');
        const existing = await database_1.default.reviewReply.findFirst({ where: { reviewId } });
        if (existing)
            throw new common_1.BadRequestException('已回复过该评价');
        return database_1.default.reviewReply.create({ data: { reviewId, shopId, content } });
    }
    async getUserReviews(userId, page = 1, pageSize = 10) {
        const [data, total] = await Promise.all([
            database_1.default.review.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    product: { select: { id: true, name: true, images: true } },
                    replies: { include: { shop: { select: { name: true } } } },
                },
            }),
            database_1.default.review.count({ where: { userId } }),
        ]);
        return { data, total, page, pageSize };
    }
    async getShopReviews(shopId, page = 1, pageSize = 10) {
        const [data, total] = await Promise.all([
            database_1.default.review.findMany({
                where: { product: { shopId } },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    user: { select: { nickname: true } },
                    product: { select: { id: true, name: true } },
                    replies: true,
                },
            }),
            database_1.default.review.count({ where: { product: { shopId } } }),
        ]);
        return { data, total, page, pageSize };
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)()
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map