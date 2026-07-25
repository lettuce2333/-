import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import prisma from '@zuoye/database';

@Injectable()
export class ShopsService {
  async getShop(id: number) {
    const shop = await prisma.shop.findUnique({
      where: { id },
      include: { owner: { select: { id: true, nickname: true } } },
    });
    if (!shop) throw new NotFoundException('店铺不存在');
    return shop;
  }

  async getMyShop(userId: number) {
    const member = await prisma.shopMember.findFirst({
      where: { userId },
      include: { shop: true },
    });
    return member?.shop || null;
  }

  async createShop(userId: number, data: { name: string; description?: string; contactPhone?: string }) {
    const existing = await prisma.shop.findFirst({ where: { ownerId: userId } });
    if (existing) throw new ConflictException('您已拥有店铺');
    const shop = await prisma.shop.create({
      data: { ...data, ownerId: userId, status: 'pending' },
    });
    await prisma.shopMember.create({
      data: { shopId: shop.id, userId, role: 'shop_owner' },
    });
    return shop;
  }

  async updateShop(userId: number, shopId: number, data: any) {
    const member = await prisma.shopMember.findFirst({ where: { userId, shopId, role: 'shop_owner' } });
    if (!member) throw new ForbiddenException('只有店主可以修改店铺');
    return prisma.shop.update({ where: { id: shopId }, data });
  }

  async getMembers(shopId: number) {
    return prisma.shopMember.findMany({
      where: { shopId },
      include: { user: { select: { id: true, nickname: true, email: true } } },
    });
  }

  async addMember(ownerId: number, shopId: number, data: { userId: number; role: string }) {
    const member = await prisma.shopMember.findFirst({ where: { userId: ownerId, shopId, role: 'shop_owner' } });
    if (!member) throw new ForbiddenException('只有店主可以添加成员');
    return prisma.shopMember.create({ data: { shopId, ...data } });
  }

  async removeMember(ownerId: number, shopId: number, memberId: number) {
    const member = await prisma.shopMember.findFirst({ where: { userId: ownerId, shopId, role: 'shop_owner' } });
    if (!member) throw new ForbiddenException('只有店主可以移除成员');
    return prisma.shopMember.delete({ where: { id: memberId } });
  }

  async getShopStats(shopId: number) {
    const [orders, products, afterSales] = await Promise.all([
      prisma.order.count({ where: { shopId } }),
      prisma.product.count({ where: { shopId } }),
      prisma.afterSale.count({ where: { shopId, status: { notIn: ['REFUNDED', 'CLOSED'] } } }),
    ]);
    const revenue = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { shopId, status: { notIn: ['CANCELLED', 'PENDING_PAYMENT'] } },
    });
    return { orders, products, afterSales, revenue: revenue._sum.totalAmount || 0 };
  }

  async getLogisticsTemplates(shopId: number) {
    return prisma.logisticsTemplate.findMany({ where: { shopId } });
  }

  async createLogisticsTemplate(shopId: number, data: { name: string; company: string; price: number }) {
    return prisma.logisticsTemplate.create({ data: { ...data, shopId } });
  }

  async updateLogisticsTemplate(shopId: number, id: number, data: { name?: string; company?: string; price?: number }) {
    return prisma.logisticsTemplate.update({ where: { id }, data });
  }

  async deleteLogisticsTemplate(shopId: number, id: number) {
    return prisma.logisticsTemplate.delete({ where: { id } });
  }

  async getShopByOwner(userId: number) {
    const mem = await prisma.shopMember.findFirst({
      where: { userId },
      include: { shop: { include: { owner: { select: { id: true, nickname: true } } } } },
    });
    return mem?.shop || null;
  }
}
