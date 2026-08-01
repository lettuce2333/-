import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import prisma from '@zuoye/database';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  constructor(private notificationsService: NotificationsService) {}

  async create(userId: number, data: { addressId: number; items: { skuId: number; quantity: number }[]; remark?: string }) {
    // Get address
    const address = await prisma.address.findFirst({ where: { id: data.addressId, userId } });
    if (!address) throw new NotFoundException('地址不存在');

    // Group items by shop and validate stock
    const shopGroups = new Map<number, any[]>();
    for (const item of data.items) {
      const sku = await prisma.productSku.findUnique({ where: { id: item.skuId } });
      if (!sku) throw new NotFoundException(`SKU ${item.skuId} 不存在`);
      const product = await prisma.product.findUnique({ where: { id: sku.productId } });
      if (!product) throw new NotFoundException(`商品不存在`);
      if (sku.stock < item.quantity) throw new BadRequestException(`${product.name} 库存不足`);
      if (product.status !== 'active') throw new BadRequestException(`${product.name} 已下架`);

      const shopId = product.shopId;
      if (!shopGroups.has(shopId)) shopGroups.set(shopId, []);
      shopGroups.get(shopId)!.push({ sku, product, quantity: item.quantity });
    }

    // Create orders (one per shop)
    const orders: any[] = [];
    for (const [shopId, items] of shopGroups) {
      const orderNo = `ORD${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const totalAmount = items.reduce((sum, i) => sum + i.sku.price * i.quantity, 0);

      // Deduct stock
      for (const item of items) {
        const newStock = item.sku.stock - item.quantity;
        if (newStock < 0) throw new BadRequestException(`${item.product.name} 库存不足`);
        await prisma.productSku.update({ where: { id: item.sku.id }, data: { stock: newStock } });
        await prisma.product.update({ where: { id: item.product.id }, data: { sales: (item.product.sales || 0) + item.quantity } });
      }

      // Create order
      const order = await prisma.order.create({
        data: {
          orderNo, userId, shopId, totalAmount,
          receiverName: address.receiver,
          receiverPhone: address.phone,
          receiverAddress: `${address.province}${address.city}${address.district}${address.detail}`,
        },
      });

      // Create order items
      for (const i of items) {
        let image = null;
        try { const imgs = JSON.parse(i.product.images || '[]'); image = imgs[0] || null; } catch {}
        await prisma.orderItem.create({
          data: { orderId: order.id, productId: i.product.id, skuId: i.sku.id, productName: i.product.name, skuSpecs: i.sku.specs, quantity: i.quantity, unitPrice: i.sku.price, subtotal: i.sku.price * i.quantity, image },
        });
      }

      // Create status log
      await prisma.orderStatusLog.create({ data: { orderId: order.id, fromStatus: null, toStatus: 'PENDING_PAYMENT', operator: 'system', remark: '订单创建' } });

      // Attach items for response
      order.items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
      orders.push(order);
    }

    // Clear ordered items from cart
    const orderedSkuIds = data.items.map(i => i.skuId);
    for (const skuId of orderedSkuIds) {
      await prisma.cartItem.deleteMany({ where: { userId, skuId } });
    }

    return orders;
  }

  async getUserOrders(userId: number, query: { status?: string; page?: number; pageSize?: number }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const where: any = { userId };
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);
    for (const order of data) {
      order.items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
      order.shop = await prisma.shop.findUnique({ where: { id: order.shopId } });
      order.logistics = await prisma.logistics.findUnique({ where: { orderId: order.id } });
    }
    return { data, total, page, pageSize };
  }

  async getOrderDetail(orderId: number, userId?: number) {
    const where: any = { id: orderId };
    if (userId) where.userId = userId;

    const order = await prisma.order.findFirst({
      where,
      include: {
        items: { include: { product: { select: { id: true, name: true } } } },
        shop: { select: { id: true, name: true } },
        logistics: true,
        payments: true,
        statusLogs: { orderBy: { createdAt: 'asc' } },
        afterSales: true,
      },
    });
    if (!order) throw new NotFoundException('订单不存在');
    return order;
  }

  async pay(orderId: number, userId: number) {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.status !== 'PENDING_PAYMENT') throw new BadRequestException('订单状态不允许支付');

    await prisma.payment.create({ data: { orderId, amount: order.totalAmount, method: 'mock_wallet' } });
    await prisma.order.update({ where: { id: orderId }, data: { status: 'PAID', paidAt: new Date().toISOString() } });
    await prisma.orderStatusLog.create({ data: { orderId, fromStatus: 'PENDING_PAYMENT', toStatus: 'PAID', operator: 'user', remark: '支付成功' } });
    return prisma.order.findUnique({ where: { id: orderId } });
  }

  async cancel(orderId: number, userId: number, reason?: string) {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.status !== 'PENDING_PAYMENT' && order.status !== 'PAID') {
      throw new BadRequestException('当前状态不允许取消');
    }

    return prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { status: 'CANCELLED', cancelReason: reason } });
      // Restore stock
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        await tx.productSku.update({ where: { id: item.skuId }, data: { stock: { increment: item.quantity } } });
        await tx.product.update({ where: { id: item.productId }, data: { sales: { decrement: item.quantity } } });
      }
      await tx.orderStatusLog.create({
        data: { orderId, fromStatus: order.status, toStatus: 'CANCELLED', operator: 'user', remark: reason || '用户取消' },
      });
    });
  }

  async ship(orderId: number, shopId: number, company?: string, trackingNo?: string) {
    const order = await prisma.order.findFirst({ where: { id: orderId, shopId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.status !== 'PAID') throw new BadRequestException('订单未付款');

    const courier = company || '顺丰速运';
    const trackNo = trackingNo || `SF${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    await prisma.order.update({ where: { id: orderId }, data: { status: 'SHIPPED', shippedAt: new Date().toISOString() } });
    await prisma.logistics.create({ data: { orderId, company: courier, trackingNo: trackNo, status: 'shipped', shippedAt: new Date().toISOString() } });
    await prisma.orderStatusLog.create({ data: { orderId, fromStatus: 'PAID', toStatus: 'SHIPPED', operator: 'shop', remark: `发货，${courier}: ${trackNo}` } });
    return prisma.order.findUnique({ where: { id: orderId } });
  }

  async receive(orderId: number, userId: number) {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.status !== 'SHIPPED' && order.status !== 'DELIVERED') throw new BadRequestException('订单未发货');

    await prisma.order.update({ where: { id: orderId }, data: { status: 'RECEIVED', receivedAt: new Date().toISOString() } });
    await prisma.orderStatusLog.create({ data: { orderId, fromStatus: order.status, toStatus: 'RECEIVED', operator: 'user', remark: '用户确认收货' } });
    return prisma.order.findUnique({ where: { id: orderId } });
  }

  // === Merchant order queries ===
  async getShopOrders(shopId: number, query: { status?: string; page?: number; pageSize?: number }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const where: any = { shopId };
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);
    for (const order of data) {
      order.items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
      order.logistics = await prisma.logistics.findUnique({ where: { orderId: order.id } });
    }
    return { data, total, page, pageSize };
  }

  // === Auto-cancel (30 min) ===
  async autoCancelExpiredOrders() {
    const deadline = new Date(Date.now() - 30 * 60 * 1000);
    const expired = await prisma.order.findMany({
      where: { status: 'PENDING_PAYMENT', createdAt: { lte: deadline } },
    });
    for (const order of expired) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED', cancelReason: '超时未支付' } });
          const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
          for (const item of items) {
            await tx.productSku.update({ where: { id: item.skuId }, data: { stock: { increment: item.quantity } } });
          }
          await tx.orderStatusLog.create({
            data: { orderId: order.id, fromStatus: 'PENDING_PAYMENT', toStatus: 'CANCELLED', operator: 'system', remark: '超时未支付自动取消' },
          });
        });
        await this.notificationsService.create(order.userId, 'order', '订单已取消', `订单 ${order.orderNo} 因超时未支付已自动取消`);
      } catch (e) {
        console.error(`Auto-cancel failed for order ${order.id}:`, e);
      }
    }
  }

  // === Auto-complete (15 days after receiving) ===
  async autoCompleteOrders() {
    const deadline = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const toComplete = await prisma.order.findMany({
      where: { status: 'RECEIVED', receivedAt: { lte: deadline } },
    });
    for (const order of toComplete) {
      await prisma.order.update({ where: { id: order.id }, data: { status: 'COMPLETED', completedAt: new Date() } });
    }
  }
}
