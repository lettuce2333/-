import { Injectable, NotFoundException } from '@nestjs/common';
import prisma from '@zuoye/database';

@Injectable()
export class CartService {
  async getCart(userId?: number, guestId?: string) {
    const where: any = {};
    if (userId) where.userId = userId;
    else if (guestId) where.guestId = guestId;
    else return [];

    return prisma.cartItem.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, images: true, status: true } },
        sku: true,
      },
      orderBy: { id: 'desc' },
    });
  }

  async addItem(userId: number | undefined, guestId: string | undefined, data: { productId: number; skuId: number; quantity: number }) {
    const sku = await prisma.productSku.findUnique({ where: { id: data.skuId } });
    if (!sku) throw new NotFoundException('SKU不存在');

    const existing = await prisma.cartItem.findFirst({
      where: userId
        ? { userId, skuId: data.skuId }
        : { guestId, skuId: data.skuId },
    });

    if (existing) {
      return prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + data.quantity },
      });
    }

    return prisma.cartItem.create({
      data: { userId, guestId, productId: data.productId, skuId: data.skuId, quantity: data.quantity },
    });
  }

  async updateQuantity(id: number, quantity: number, userId?: number, guestId?: string) {
    const where: any = { id };
    if (userId) where.userId = userId;
    else if (guestId) where.guestId = guestId;
    const item = await prisma.cartItem.findFirst({ where });
    if (!item) throw new NotFoundException('购物车商品不存在');
    return prisma.cartItem.update({ where: { id }, data: { quantity } });
  }

  async removeItem(id: number, userId?: number, guestId?: string) {
    const where: any = { id };
    if (userId) where.userId = userId;
    else if (guestId) where.guestId = guestId;
    const item = await prisma.cartItem.findFirst({ where });
    if (!item) throw new NotFoundException('购物车商品不存在');
    return prisma.cartItem.delete({ where: { id } });
  }

  async mergeGuestCart(guestId: string, userId: number) {
    const guestItems = await prisma.cartItem.findMany({ where: { guestId } });
    for (const item of guestItems) {
      const existing = await prisma.cartItem.findFirst({ where: { userId, skuId: item.skuId } });
      if (existing) {
        await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + item.quantity } });
        await prisma.cartItem.delete({ where: { id: item.id } });
      } else {
        await prisma.cartItem.update({ where: { id: item.id }, data: { userId, guestId: null } });
      }
    }
  }
}
