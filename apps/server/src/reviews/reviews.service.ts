import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import prisma from '@zuoye/database';

@Injectable()
export class ReviewsService {
  async getProductReviews(productId: number, page = 1, pageSize = 10) {
    const [data, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { nickname: true, avatar: true } },
          replies: { include: { shop: { select: { name: true } } } },
        },
      }),
      prisma.review.count({ where: { productId } }),
    ]);
    return { data, total, page, pageSize };
  }

  async createReview(userId: number, data: { productId: number; orderId: number; rating: number; content: string; images?: string[]; isAnonymous?: boolean }) {
    const order = await prisma.order.findFirst({ where: { id: data.orderId, userId, status: { in: ['RECEIVED', 'COMPLETED'] } } });
    if (!order) throw new BadRequestException('订单不可评价');

    const hasItem = await prisma.orderItem.findFirst({ where: { orderId: data.orderId, productId: data.productId } });
    if (!hasItem) throw new BadRequestException('该订单不包含此商品');

    const existing = await prisma.review.findUnique({ where: { userId_orderId_productId: { userId, orderId: data.orderId, productId: data.productId } } });
    if (existing) throw new BadRequestException('已评价过该商品');

    if (data.rating < 1 || data.rating > 5) throw new BadRequestException('评分必须在1-5之间');

    return prisma.review.create({
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

  async replyReview(shopId: number, reviewId: number, content: string) {
    const review = await prisma.review.findUnique({ where: { id: reviewId }, include: { product: true } });
    if (!review) throw new NotFoundException('评价不存在');
    if (review.product.shopId !== shopId) throw new ForbiddenException('无权回复');

    const existing = await prisma.reviewReply.findFirst({ where: { reviewId } });
    if (existing) throw new BadRequestException('已回复过该评价');

    return prisma.reviewReply.create({ data: { reviewId, shopId, content } });
  }

  async getUserReviews(userId: number, page = 1, pageSize = 10) {
    const [data, total] = await Promise.all([
      prisma.review.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          product: { select: { id: true, name: true, images: true } },
          replies: { include: { shop: { select: { name: true } } } },
        },
      }),
      prisma.review.count({ where: { userId } }),
    ]);
    return { data, total, page, pageSize };
  }

  async getShopReviews(shopId: number, page = 1, pageSize = 10) {
    const [data, total] = await Promise.all([
      prisma.review.findMany({
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
      prisma.review.count({ where: { product: { shopId } } }),
    ]);
    return { data, total, page, pageSize };
  }
}
