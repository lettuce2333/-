import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import prisma from '@zuoye/database';

@Injectable()
export class ReviewsService {
  private async enrichReviews(reviews: any[]) {
    if (!reviews.length) return reviews;

    const userIds = [...new Set(reviews.map((r) => r.userId))];
    const reviewIds = reviews.map((r) => r.id);
    const [users, replies] = await Promise.all([
      prisma.user.findMany({ where: { id: { in: userIds } } }),
      prisma.reviewReply.findMany({ where: { reviewId: { in: reviewIds } } }),
    ]);

    const userMap = new Map(users.map((u: any) => [u.id, u]));
    const replyMap = new Map<number, any[]>();
    for (const reply of replies) {
      const list = replyMap.get(reply.reviewId) || [];
      list.push(reply);
      replyMap.set(reply.reviewId, list);
    }

    const shopIds = [...new Set(replies.map((r) => r.shopId))];
    const shops = shopIds.length
      ? await prisma.shop.findMany({ where: { id: { in: shopIds } } })
      : [];
    const shopMap = new Map(shops.map((s: any) => [s.id, s]));

    return reviews.map((r: any) => ({
      ...r,
      user: r.isAnonymous ? null : userMap.get(r.userId) || null,
      replies: (replyMap.get(r.id) || []).map((rp: any) => ({
        ...rp,
        shop: shopMap.get(rp.shopId) || null,
      })),
    }));
  }

  async getProductReviews(productId: number, page = 1, pageSize = 10) {
    const [data, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.review.count({ where: { productId } }),
    ]);
    return { data: await this.enrichReviews(data), total, page, pageSize };
  }

  async createReview(userId: number, data: { productId: number; orderId: number; rating: number; content: string; images?: string[]; isAnonymous?: boolean }) {
    if (!data.productId || !data.orderId) {
      throw new BadRequestException('请选择要评价的商品');
    }
    if (!data.content || !String(data.content).trim()) {
      throw new BadRequestException('请输入评价内容');
    }
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('评分必须在1-5之间');
    }

    const order = await prisma.order.findFirst({
      where: { id: data.orderId, userId, status: { in: ['RECEIVED', 'COMPLETED'] } },
    });
    if (!order) throw new BadRequestException('订单不可评价');

    const hasItem = await prisma.orderItem.findFirst({
      where: { orderId: data.orderId, productId: data.productId },
    });
    if (!hasItem) throw new BadRequestException('该订单不包含此商品');

    const existing = await prisma.review.findFirst({
      where: { userId, orderId: data.orderId, productId: data.productId },
    });
    if (existing) throw new BadRequestException('已评价过该商品');

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
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('评价不存在');
    const product = await prisma.product.findUnique({ where: { id: review.productId } });
    if (!product || product.shopId !== shopId) throw new ForbiddenException('无权回复');
    if (!content || !String(content).trim()) throw new BadRequestException('请输入回复内容');

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
      }),
      prisma.review.count({ where: { userId } }),
    ]);

    const productIds = [...new Set(data.map((r: any) => r.productId))];
    const products = productIds.length
      ? await prisma.product.findMany({ where: { id: { in: productIds } } })
      : [];
    const productMap = new Map(products.map((p: any) => [p.id, p]));

    return {
      data: (await this.enrichReviews(data)).map((r: any) => ({
        ...r,
        product: productMap.get(r.productId) || null,
      })),
      total,
      page,
      pageSize,
    };
  }

  async getShopReviews(shopId: number, page = 1, pageSize = 10) {
    const products = await prisma.product.findMany({ where: { shopId } });
    const productIds = products.map((p: any) => p.id);
    const where: any = productIds.length ? { productId: { in: productIds } } : { productId: -1 };
    const [data, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.review.count({ where }),
    ]);

    const productMap = new Map(products.map((p: any) => [p.id, p]));
    const enriched = await this.enrichReviews(data);
    return {
      data: enriched.map((r: any) => ({ ...r, product: productMap.get(r.productId) || null })),
      total,
      page,
      pageSize,
    };
  }
}
