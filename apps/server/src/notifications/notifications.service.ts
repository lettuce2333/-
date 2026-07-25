import { Injectable } from '@nestjs/common';
import prisma from '@zuoye/database';

@Injectable()
export class NotificationsService {
  async create(userId: number, type: string, title: string, content?: string, relatedId?: number) {
    return prisma.notification.create({ data: { userId, type, title, content, relatedId } });
  }

  async getUserNotifications(userId: number, page = 1, pageSize = 20) {
    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);
    return { data, total, page, pageSize };
  }

  async markAsRead(userId: number, id: number) {
    return prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  }

  async markAllAsRead(userId: number) {
    return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  }
}
