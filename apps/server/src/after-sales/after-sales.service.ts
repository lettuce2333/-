import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import prisma from '@zuoye/database';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AfterSalesService {
  constructor(private notificationsService: NotificationsService) {}

  async apply(userId: number, data: { orderId: number; type: string; reason: string; amount: number }) {
    const order = await prisma.order.findFirst({ where: { id: data.orderId, userId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.status === 'PENDING_PAYMENT' || order.status === 'CANCELLED') {
      throw new BadRequestException('当前订单状态不支持申请售后');
    }

    // Check existing active after-sale
    const existing = await prisma.afterSale.findFirst({
      where: { orderId: data.orderId, status: { notIn: ['REFUNDED', 'CLOSED'] } },
    });
    if (existing) throw new BadRequestException('已有进行中的售后申请');

    if (data.amount > order.totalAmount) throw new BadRequestException('退款金额不能超过订单总额');

    const afterSale = await prisma.afterSale.create({
      data: {
        orderId: data.orderId,
        userId,
        shopId: order.shopId,
        type: data.type,
        reason: data.reason,
        amount: data.amount,
        logs: { create: { operator: 'user', action: 'apply', remark: data.reason } },
      },
      include: { logs: true },
    });

    await this.notificationsService.create(
      userId, 'after_sale', '售后申请已提交',
      `订单 ${order.orderNo} 的售后申请已提交，等待商家处理`, afterSale.id,
    );

    return afterSale;
  }

  async getUserAfterSales(userId: number, page = 1, pageSize = 10) {
    const [data, total] = await Promise.all([
      prisma.afterSale.findMany({
        where: { userId },
        orderBy: { appliedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          order: { select: { orderNo: true, totalAmount: true } },
          logs: { orderBy: { createdAt: 'desc' }, take: 3 },
        },
      }),
      prisma.afterSale.count({ where: { userId } }),
    ]);
    return { data, total, page, pageSize };
  }

  async getAfterSaleDetail(id: number, userId?: number) {
    const where: any = { id };
    if (userId) where.userId = userId;

    const afterSale = await prisma.afterSale.findFirst({
      where,
      include: {
        order: { select: { orderNo: true, status: true, totalAmount: true } },
        logs: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!afterSale) throw new NotFoundException('售后记录不存在');
    return afterSale;
  }

  // === Merchant actions ===
  async getShopAfterSales(shopId: number, query: { status?: string; page?: number; pageSize?: number }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const where: any = { shopId };
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      prisma.afterSale.findMany({
        where,
        orderBy: { appliedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          order: { select: { orderNo: true } },
          user: { select: { id: true, nickname: true } },
          logs: { orderBy: { createdAt: 'desc' }, take: 3 },
        },
      }),
      prisma.afterSale.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  async shopApprove(afterSaleId: number, shopId: number) {
    const as = await prisma.afterSale.findFirst({ where: { id: afterSaleId, shopId, status: 'PENDING' } });
    if (!as) throw new NotFoundException('售后申请不存在');

    const updates: any = { status: 'SHOP_APPROVED' };
    const logAction = 'approve';

    if (as.type === 'refund_only') {
      updates.status = 'REFUNDED';
      updates.resolvedAt = new Date();
    } else {
      updates.status = 'WAITING_RETURN';
    }

    await prisma.afterSale.update({ where: { id: afterSaleId }, data: updates });
    await prisma.afterSaleLog.create({ data: { afterSaleId, operator: 'shop_owner', action: logAction, remark: '商家同意售后' } });

    if (updates.status === 'REFUNDED') {
      await this.refundOrder(as.orderId);
    }

    await this.notificationsService.create(as.userId, 'after_sale', '商家已同意售后', `售后申请已通过`, afterSaleId);
  }

  async shopRefuse(afterSaleId: number, shopId: number, remark?: string) {
    const as = await prisma.afterSale.findFirst({ where: { id: afterSaleId, shopId, status: 'PENDING' } });
    if (!as) throw new NotFoundException('售后申请不存在');

    await prisma.afterSale.update({ where: { id: afterSaleId }, data: { status: 'SHOP_REFUSED' } });
    await prisma.afterSaleLog.create({ data: { afterSaleId, operator: 'shop_owner', action: 'refuse', remark: remark || '商家拒绝售后' } });

    await this.notificationsService.create(as.userId, 'after_sale', '商家拒绝了售后', `拒绝原因: ${remark || '无'}`, afterSaleId);
  }

  async buyerShip(afterSaleId: number, userId: number) {
    const as = await prisma.afterSale.findFirst({ where: { id: afterSaleId, userId, status: 'WAITING_RETURN' } });
    if (!as) throw new NotFoundException('售后申请不存在或状态不正确');

    await prisma.afterSale.update({ where: { id: afterSaleId }, data: { status: 'BUYER_SHIPPED' } });
    await prisma.afterSaleLog.create({ data: { afterSaleId, operator: 'user', action: 'ship', remark: '用户已寄回商品' } });

    await this.notificationsService.create(as.userId, 'after_sale', '商品已寄回', '等待商家确认收货', afterSaleId);
  }

  async shopReceive(afterSaleId: number, shopId: number) {
    const as = await prisma.afterSale.findFirst({ where: { id: afterSaleId, shopId, status: 'BUYER_SHIPPED' } });
    if (!as) throw new NotFoundException('售后申请不存在');

    await prisma.afterSale.update({ where: { id: afterSaleId }, data: { status: 'SHOP_RECEIVED' } });
    await prisma.afterSaleLog.create({ data: { afterSaleId, operator: 'shop_owner', action: 'receive', remark: '商家已确认收货' } });

    // After receiving, process refund
    await this.doRefund(afterSaleId);
  }

  // === Admin actions ===
  async adminArbitrate(afterSaleId: number, adminId: number, decision: string, remark?: string) {
    const as = await prisma.afterSale.findUnique({ where: { id: afterSaleId } });
    if (!as || as.status !== 'DISPUTE') throw new BadRequestException('售后申请状态不正确');

    let newStatus: string;
    let logAction: string;

    switch (decision) {
      case 'refund':
        newStatus = 'ADMIN_REFUND';
        logAction = 'resolve';
        break;
      case 'reject':
        newStatus = 'ADMIN_REJECT';
        logAction = 'resolve';
        break;
      case 'partial':
        newStatus = 'ADMIN_PARTIAL';
        logAction = 'resolve';
        break;
      default:
        throw new BadRequestException('无效的仲裁决定');
    }

    await prisma.afterSale.update({ where: { id: afterSaleId }, data: { status: newStatus, resolvedAt: new Date() } });
    await prisma.afterSaleLog.create({ data: { afterSaleId, operator: 'admin', action: logAction, remark: remark || `管理员仲裁: ${decision}` } });

    if (newStatus === 'ADMIN_REFUND' || newStatus === 'ADMIN_PARTIAL') {
      await this.refundOrder(as.orderId);
    }
  }

  // === Buyer dispute (after shop refused) ===
  async dispute(afterSaleId: number, userId: number) {
    const as = await prisma.afterSale.findFirst({ where: { id: afterSaleId, userId, status: 'SHOP_REFUSED' } });
    if (!as) throw new BadRequestException('无法申诉');

    await prisma.afterSale.update({ where: { id: afterSaleId }, data: { status: 'DISPUTE' } });
    await prisma.afterSaleLog.create({ data: { afterSaleId, operator: 'user', action: 'arbitrate', remark: '用户发起申诉，等待管理员介入' } });
  }

  // === Auto approve after 48h ===
  async autoApprovePending() {
    const deadline = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const pending = await prisma.afterSale.findMany({ where: { status: 'PENDING', appliedAt: { lte: deadline } } });
    for (const as of pending) {
      try {
        if (as.type === 'refund_only') {
          await prisma.afterSale.update({ where: { id: as.id }, data: { status: 'AUTO_APPROVED', autoApprovedAt: new Date() } });
          await this.refundOrder(as.orderId);
        } else {
          await prisma.afterSale.update({ where: { id: as.id }, data: { status: 'AUTO_APPROVED', autoApprovedAt: new Date() } });
        }
        await prisma.afterSaleLog.create({ data: { afterSaleId: as.id, operator: 'system', action: 'resolve', remark: '商家超时未处理，系统自动同意' } });
        await this.notificationsService.create(as.userId, 'after_sale', '售后申请已自动同意', '商家超时未处理，系统已自动同意您的售后申请', as.id);
      } catch (e) {
        console.error(`Auto-approve failed for after-sale ${as.id}:`, e);
      }
    }
  }

  // === Auto receive after 10 days ===
  async autoReceiveReturned() {
    const deadline = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const shipped = await prisma.afterSale.findMany({ where: { status: 'BUYER_SHIPPED', appliedAt: { lte: deadline } } });
    for (const as of shipped) {
      try {
        await prisma.afterSale.update({ where: { id: as.id }, data: { status: 'AUTO_RECEIVED' } });
        await this.doRefund(as.id);
        await prisma.afterSaleLog.create({ data: { afterSaleId: as.id, operator: 'system', action: 'receive', remark: '商家超时未确认收货，系统自动确认' } });
      } catch (e) {
        console.error(`Auto-receive failed for after-sale ${as.id}:`, e);
      }
    }
  }

  private async refundOrder(orderId: number) {
    await prisma.order.update({ where: { id: orderId }, data: { status: 'REFUNDED' } });
  }

  private async doRefund(afterSaleId: number) {
    const as = await prisma.afterSale.findUnique({ where: { id: afterSaleId } });
    if (!as) return;
    await prisma.afterSale.update({ where: { id: afterSaleId }, data: { status: 'REFUNDED', resolvedAt: new Date() } });
    await this.refundOrder(as.orderId);
  }
}
