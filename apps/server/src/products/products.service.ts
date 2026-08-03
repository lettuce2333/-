import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import prisma from '@zuoye/database';

@Injectable()
export class ProductsService {
  async findAll(query: { categoryId?: number; keyword?: string; page?: number; pageSize?: number; sort?: string; priceMin?: string; priceMax?: string }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const where: any = { status: 'active' };

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.keyword) where.name = { contains: query.keyword };
    if (query.priceMin) where.price = { ...(where.price || {}), gte: parseFloat(query.priceMin) };
    if (query.priceMax) where.price = { ...(where.price || {}), lte: parseFloat(query.priceMax) };

    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'price_asc') orderBy = { price: 'asc' };
    else if (query.sort === 'price_desc') orderBy = { price: 'desc' };
    else if (query.sort === 'sales') orderBy = { sales: 'desc' };

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { shop: { select: { id: true, name: true } }, category: { select: { id: true, name: true } } },
      }),
      prisma.product.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async findOne(id: number) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('商品不存在');
    product.skus = await prisma.productSku.findMany({ where: { productId: id } });
    product.shop = await prisma.shop.findUnique({ where: { id: product.shopId } });
    product.category = await prisma.category.findUnique({ where: { id: product.categoryId } });
    product.reviews = await this.loadReviews(id);
    return product;
  }

  private async loadReviews(productId: number) {
    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    if (!reviews.length) return [];

    const userIds = [...new Set(reviews.map((r: any) => r.userId))];
    const reviewIds = reviews.map((r: any) => r.id);
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

    return reviews.map((r: any) => ({
      ...r,
      user: r.isAnonymous ? null : userMap.get(r.userId) || null,
      replies: replyMap.get(r.id) || [],
    }));
  }

  async getShopProducts(shopId: number, query: { page?: number; pageSize?: number; status?: string }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const where: any = { shopId };
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);
    for (const p of data) {
      p.skus = await prisma.productSku.findMany({ where: { productId: p.id } });
    }
    return { data, total, page, pageSize };
  }

  async createProduct(shopId: number, userId: number, data: any) {
    const member = await prisma.shopMember.findFirst({ where: { userId, shopId, role: { in: ['shop_owner'] } } });
    if (!member) throw new ForbiddenException('无权操作');

    const variantList = Array.isArray(data.variants) ? data.variants : [];
    const totalStock = variantList.reduce((sum: number, v: any) => sum + (parseInt(v.stock) || 0), 0);
    const variantsLabel = variantList.map((v: any) => v.name).join(' / ');

    const product = await prisma.product.create({
      data: {
        shopId,
        name: data.name,
        categoryId: data.categoryId,
        description: data.description || '',
        images: JSON.stringify(data.images || []),
        price: data.price || 0,
        totalStock,
        tokenPrice: parseInt(data.tokenPrice) || 0,
        variants: variantsLabel,
        status: 'draft',
      },
    });

    // Create SKU for each variant
    for (const v of variantList) {
      await prisma.productSku.create({
        data: {
          productId: product.id,
          specs: v.name || '',
          price: data.price || 0,
          stock: parseInt(v.stock) || 0,
        },
      });
    }
    return product;
  }

  async updateProduct(shopId: number, userId: number, productId: number, data: any) {
    const member = await prisma.shopMember.findFirst({ where: { userId, shopId, role: { in: ['shop_owner'] } } });
    if (!member) throw new ForbiddenException('无权操作');

    const product = await prisma.product.findFirst({ where: { id: productId, shopId } });
    if (!product) throw new NotFoundException('商品不存在');

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.images !== undefined) updateData.images = JSON.stringify(data.images);
    if (data.price !== undefined) updateData.price = data.price;
    if (data.tokenPrice !== undefined) updateData.tokenPrice = parseInt(data.tokenPrice) || 0;

    const variantList = Array.isArray(data.variants) ? data.variants : [];
    if (variantList.length > 0) {
      const totalStock = variantList.reduce((sum: number, v: any) => sum + (parseInt(v.stock) || 0), 0);
      const variantsLabel = variantList.map((v: any) => v.name).join(' / ');
      updateData.totalStock = totalStock;
      updateData.variants = variantsLabel;

      // Sync SKUs without deleting referenced rows
      const existingSkus = await prisma.productSku.findMany({ where: { productId } });
      const submittedNames = variantList.map((v: any) => String(v.name || '').trim());
      for (const v of variantList) {
        const name = String(v.name || '').trim();
        const variantPrice =
          v.price !== undefined && v.price !== null && v.price !== ''
            ? Number(v.price)
            : data.price || product.price;
        const stock = parseInt(v.stock) || 0;
        const existing = existingSkus.find((s: any) => String(s.specs || '').trim() === name);
        if (existing) {
          await prisma.productSku.update({ where: { id: existing.id }, data: { price: variantPrice, stock } });
        } else {
          await prisma.productSku.create({
            data: { productId, specs: name, price: variantPrice, stock },
          });
        }
      }
      for (const sku of existingSkus) {
        if (submittedNames.includes(String(sku.specs || '').trim())) continue;
        try {
          await prisma.productSku.delete({ where: { id: sku.id } });
        } catch {
          await prisma.productSku.update({ where: { id: sku.id }, data: { stock: 0 } });
        }
      }
    }

    const updated = await prisma.product.update({ where: { id: productId }, data: updateData });
    updated.skus = await prisma.productSku.findMany({ where: { productId } });
    return updated;
  }

  async submitForReview(shopId: number, userId: number, productId: number) {
    const member = await prisma.shopMember.findFirst({ where: { userId, shopId, role: { in: ['shop_owner'] } } });
    if (!member) throw new ForbiddenException('无权操作');
    return prisma.product.update({ where: { id: productId }, data: { status: 'active' } });
  }
}
