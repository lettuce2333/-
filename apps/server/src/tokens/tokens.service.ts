import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import prisma from '@zuoye/database';

const TOKEN_RATE = 100; // 100 法庭币 = 1 元
const COUPON_VALID_DAYS = 30;

@Injectable()
export class TokensService {
  private async ensureAccount(userId: number) {
    let account = await prisma.courtTokenAccount.findFirst({ where: { userId } });
    if (!account) {
      account = await prisma.courtTokenAccount.create({ data: { userId, balance: 0, totalEarned: 0 } });
    }
    return account;
  }

  async getMe(userId: number) {
    const account = await this.ensureAccount(userId);
    const transactions = await prisma.tokenTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { ...account, transactions };
  }

  async getCoupons(userId: number) {
    const rows = await prisma.coupon.findMany({ where: { userId, status: 'unused' } });
    const now = Date.now();
    return rows.filter((c) => new Date(c.expiresAt).getTime() > now);
  }

  async redeemCoupon(userId: number, amountYuan = 1) {
    const yuan = Math.max(1, Math.floor(Number(amountYuan) || 1));
    const cost = yuan * TOKEN_RATE;
    const account = await this.ensureAccount(userId);
    if (account.balance < cost) throw new BadRequestException('法庭币不足');

    await prisma.courtTokenAccount.update({ where: { userId }, data: { balance: { decrement: cost } } });
    const coupon = await prisma.coupon.create({
      data: {
        userId,
        title: `${yuan}元优惠券`,
        amount: yuan,
        minSpend: yuan,
        expiresAt: new Date(Date.now() + COUPON_VALID_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    await prisma.tokenTransaction.create({
      data: { userId, type: 'redeem_coupon', amount: -cost, couponId: coupon.id, uniqueKey: `coupon-${coupon.id}` },
    });
    return coupon;
  }

  async getRedeemableProducts() {
    const products = await prisma.product.findMany({
      where: { status: 'active', tokenPrice: { gt: 0 } },
      orderBy: { createdAt: 'desc' },
    });
    const data: any[] = [];
    for (const p of products) {
      const shop = await prisma.shop.findUnique({ where: { id: p.shopId } });
      const skus = await prisma.productSku.findMany({ where: { productId: p.id } });
      data.push({ ...p, shop: shop ? { id: shop.id, name: shop.name } : null, skus });
    }
    return data;
  }

  async redeemProduct(userId: number, skuId: number, quantity = 1) {
    const qty = Math.max(1, Math.floor(Number(quantity) || 1));
    const sku = await prisma.productSku.findUnique({ where: { id: skuId } });
    if (!sku) throw new NotFoundException('商品规格不存在');
    const product = await prisma.product.findUnique({ where: { id: sku.productId } });
    if (!product || product.tokenPrice <= 0) throw new BadRequestException('该商品不支持法庭币兑换');
    if (sku.stock < qty) throw new BadRequestException('库存不足');

    const cost = product.tokenPrice * qty;
    const account = await this.ensureAccount(userId);
    if (account.balance < cost) throw new BadRequestException('法庭币不足');

    await prisma.courtTokenAccount.update({ where: { userId }, data: { balance: { decrement: cost } } });
    await prisma.productSku.update({ where: { id: skuId }, data: { stock: { decrement: qty } } });
    await prisma.product.update({ where: { id: product.id }, data: { sales: { increment: qty } } });

    const orderNo = `RDM${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const redemptionOrder = await prisma.redemptionOrder.create({
      data: { userId, orderNo, totalTokens: cost, status: 'COMPLETED', completedAt: new Date().toISOString() },
    });
    let image = null;
    try { const imgs = JSON.parse(product.images || '[]'); image = imgs[0] || null; } catch {}
    await prisma.redemptionOrderItem.create({
      data: {
        redemptionOrderId: redemptionOrder.id,
        productId: product.id,
        skuId: sku.id,
        productName: product.name,
        skuSpecs: sku.specs || '',
        quantity: qty,
        tokenPrice: product.tokenPrice,
        image,
      },
    });
    await prisma.tokenTransaction.create({
      data: { userId, type: 'redeem_product', amount: -cost, redemptionOrderId: redemptionOrder.id, uniqueKey: `redeem-${redemptionOrder.id}` },
    });
    redemptionOrder.items = await prisma.redemptionOrderItem.findMany({ where: { redemptionOrderId: redemptionOrder.id } });
    return redemptionOrder;
  }

  async getRedemptions(userId: number) {
    const rows = await prisma.redemptionOrder.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    const data: any[] = [];
    for (const r of rows) {
      const items = await prisma.redemptionOrderItem.findMany({ where: { redemptionOrderId: r.id } });
      data.push({ ...r, items });
    }
    return data;
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireCoupons() {
    const now = Date.now();
    const rows = await prisma.coupon.findMany({ where: { status: 'unused' } });
    for (const c of rows) {
      if (new Date(c.expiresAt).getTime() < now) {
        await prisma.coupon.update({ where: { id: c.id }, data: { status: 'expired' } });
      }
    }
  }
}
