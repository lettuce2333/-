import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import prisma from '@zuoye/database';

@Injectable()
export class FavoritesService {
  async getUserFavorites(userId: number, page = 1, pageSize = 20) {
    const [data, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          product: {
            select: { id: true, name: true, price: true, images: true, sales: true, status: true },
          },
        },
      }),
      prisma.favorite.count({ where: { userId } }),
    ]);
    return { data, total, page, pageSize };
  }

  async toggleFavorite(userId: number, productId: number) {
    const existing = await prisma.favorite.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }
    await prisma.favorite.create({ data: { userId, productId } });
    return { favorited: true };
  }

  async checkFavorite(userId: number, productId: number) {
    const existing = await prisma.favorite.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    return { favorited: !!existing };
  }
}
