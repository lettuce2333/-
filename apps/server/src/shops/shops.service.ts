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

  async getShopByOwner(userId: number) {
    const mem = await prisma.shopMember.findFirst({
      where: { userId },
      include: { shop: { include: { owner: { select: { id: true, nickname: true } } } } },
    });
    return mem?.shop || null;
  }
}
