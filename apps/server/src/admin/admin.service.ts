import { Injectable } from '@nestjs/common';
import prisma from '@zuoye/database';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrdersService } from '../orders/orders.service';
import { AfterSalesService } from '../after-sales/after-sales.service';

@Injectable()
export class AdminService {
  constructor(
    private ordersService: OrdersService,
    private afterSalesService: AfterSalesService,
  ) {}

  // ===== Auto Tasks (every 5 minutes) =====
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleAutoTasks() {
    console.log('[Cron] Running auto tasks...');
    await this.ordersService.autoCancelExpiredOrders();
    await this.ordersService.autoCompleteOrders();
    await this.afterSalesService.autoApprovePending();
    await this.afterSalesService.autoReceiveReturned();
  }

  // ===== Users =====
  async getUsers(query: { keyword?: string; page?: number; pageSize?: number }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const where: any = {};
    if (query.keyword) {
      where.OR = [
        { email: { contains: query.keyword } },
        { nickname: { contains: query.keyword } },
        { phone: { contains: query.keyword } },
      ];
    }
    const data = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const total = await prisma.user.count({ where });
    // Manually load roles for each user
    const dataWithRoles = await Promise.all(data.map(async (u: any) => {
      const roles = await prisma.userRole.findMany({ where: { userId: u.id } });
      return { ...u, roles };
    }));
    return { data: dataWithRoles, total, page, pageSize };
  }

  async toggleUserStatus(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('用户不存在');
    const newStatus = user.status === 'active' ? 'banned' : 'active';
    return prisma.user.update({ where: { id: userId }, data: { status: newStatus } });
  }

  // ===== Shops =====
  async getShops(query: { status?: string; page?: number; pageSize?: number }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const where: any = {};
    if (query.status) where.status = query.status;
    const data = await prisma.shop.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const total = await prisma.shop.count({ where });
    const dataWithOwner = await Promise.all(data.map(async (s: any) => {
      const owner = await prisma.user.findUnique({ where: { id: s.ownerId } });
      return { ...s, owner: owner ? { id: owner.id, nickname: owner.nickname, email: owner.email } : null };
    }));
    return { data: dataWithOwner, total, page, pageSize };
  }

  async approveShop(shopId: number) {
    return prisma.shop.update({ where: { id: shopId }, data: { status: 'active' } });
  }

  async rejectShop(shopId: number) {
    return prisma.shop.update({ where: { id: shopId }, data: { status: 'rejected' } });
  }

  // ===== Products =====
  async getProductsForReview(query: { status?: string; page?: number; pageSize?: number }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const where: any = {};
    if (query.status) where.status = query.status;
    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { shop: { select: { id: true, name: true } }, category: { select: { name: true } } },
      }),
      prisma.product.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  async reviewProduct(productId: number, action: string) {
    if (action === 'approve') return prisma.product.update({ where: { id: productId }, data: { status: 'active' } });
    return prisma.product.update({ where: { id: productId }, data: { status: 'rejected' } });
  }

  // ===== Categories =====
  async createCategory(data: { name: string; parentId?: number; sort?: number }) {
    const level = data.parentId ? 2 : 1;
    return prisma.category.create({ data: { name: data.name, parentId: data.parentId, level, sort: data.sort || 0 } });
  }

  async updateCategory(id: number, data: { name?: string; sort?: number }) {
    return prisma.category.update({ where: { id }, data });
  }

  async deleteCategory(id: number) {
    await prisma.product.updateMany({ where: { categoryId: id }, data: { categoryId: 1 } });
    await prisma.category.updateMany({ where: { parentId: id }, data: { parentId: null } });
    return prisma.category.delete({ where: { id } });
  }

  // ===== Orders =====
  async getOrders(query: { status?: string; page?: number; pageSize?: number }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const where: any = {};
    if (query.status) where.status = query.status;
    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          shop: { select: { id: true, name: true } },
          user: { select: { id: true, nickname: true, email: true } },
          items: { take: 3 },
        },
      }),
      prisma.order.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  // ===== After-sales for admin arbitration =====
  async getPendingArbitrations(page = 1, pageSize = 20) {
    const [data, total] = await Promise.all([
      prisma.afterSale.findMany({
        where: { status: 'DISPUTE' },
        orderBy: { appliedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          order: { select: { orderNo: true } },
          user: { select: { nickname: true } },
          shop: { select: { name: true } },
          logs: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
      }),
      prisma.afterSale.count({ where: { status: 'DISPUTE' } }),
    ]);
    return { data, total, page, pageSize };
  }

  // ===== Stats =====
  async getStats() {
    const [userCount, shopCount, productCount, orderCount, revenue] = await Promise.all([
      prisma.user.count(),
      prisma.shop.count(),
      prisma.product.count({ where: { status: 'active' } }),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: { notIn: ['CANCELLED', 'PENDING_PAYMENT'] } } }),
    ]);
    return { userCount, shopCount, productCount, orderCount, revenue: revenue._sum.totalAmount || 0 };
  }
}
