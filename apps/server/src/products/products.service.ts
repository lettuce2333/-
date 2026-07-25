import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import prisma from '@zuoye/database';

@Injectable()
export class ProductsService {
  async findAll(query: { categoryId?: number; keyword?: string; page?: number; pageSize?: number; sort?: string }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const where: any = { status: 'active' };

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.keyword) where.name = { contains: query.keyword };

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
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        skus: true,
        shop: { select: { id: true, name: true, logo: true } },
        category: { select: { id: true, name: true } },
        reviews: { take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { nickname: true, avatar: true } } } },
      },
    });
    if (!product) throw new NotFoundException('商品不存在');
    return product;
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
        include: { skus: true, category: { select: { name: true } } },
      }),
      prisma.product.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  async createProduct(shopId: number, userId: number, data: any) {
    const member = await prisma.shopMember.findFirst({ where: { userId, shopId, role: { in: ['shop_owner'] } } });
    if (!member) throw new ForbiddenException('无权操作');

    const { skus, ...productData } = data;
    const product = await prisma.product.create({
      data: {
        ...productData,
        shopId,
        images: JSON.stringify(productData.images || []),
        price: skus?.[0]?.price || 0,
        totalStock: skus?.reduce((sum: number, s: any) => sum + (s.stock || 0), 0) || 0,
        status: 'draft',
        skus: skus ? {
          create: skus.map((s: any) => ({
            specs: JSON.stringify(s.specs || {}),
            price: s.price,
            stock: s.stock,
            image: s.image,
          })),
        } : undefined,
      },
      include: { skus: true },
    });
    return product;
  }

  async updateProduct(shopId: number, userId: number, productId: number, data: any) {
    const member = await prisma.shopMember.findFirst({ where: { userId, shopId, role: { in: ['shop_owner'] } } });
    if (!member) throw new ForbiddenException('无权操作');

    const product = await prisma.product.findFirst({ where: { id: productId, shopId } });
    if (!product) throw new NotFoundException('商品不存在');

    const { skus, ...productData } = data;
    if (productData.images) productData.images = JSON.stringify(productData.images);

    if (skus) {
      await prisma.productSku.deleteMany({ where: { productId } });
      await prisma.productSku.createMany({
        data: skus.map((s: any) => ({
          productId,
          specs: JSON.stringify(s.specs || {}),
          price: s.price,
          stock: s.stock,
          image: s.image,
        })),
      });
      productData.price = skus[0]?.price || product.price;
      productData.totalStock = skus.reduce((sum: number, s: any) => sum + (s.stock || 0), 0);
    }

    return prisma.product.update({ where: { id: productId }, data: productData, include: { skus: true } });
  }

  async submitForReview(shopId: number, userId: number, productId: number) {
    const member = await prisma.shopMember.findFirst({ where: { userId, shopId, role: { in: ['shop_owner'] } } });
    if (!member) throw new ForbiddenException('无权操作');
    return prisma.product.update({ where: { id: productId }, data: { status: 'active' } });
  }
}
