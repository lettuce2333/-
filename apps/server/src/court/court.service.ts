import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import prisma from '@zuoye/database';
import { NotificationsService } from '../notifications/notifications.service';

const REWARD_PER_CORRECT_VOTE = 10;
const JUDGE_COUNT = 9;
const CASE_HOURS = 48;
const EVIDENCE_HOURS = 24;
const REBUTTAL_HOURS = 36;
const ADMIN_REVIEW_AMOUNT = 500;

@Injectable()
export class CourtService {
  constructor(private notificationsService: NotificationsService) {}

  async buyerOpen(afterSaleId: number, userId: number) {
    const as = await prisma.afterSale.findFirst({ where: { id: afterSaleId, userId, status: 'SHOP_REFUSED' } });
    if (!as) throw new BadRequestException('当前售后状态无法开启小法庭');
    return this.openCase(as, 'buyer');
  }

  async merchantOpen(afterSaleId: number, shopId: number) {
    const as = await prisma.afterSale.findFirst({ where: { id: afterSaleId, shopId, status: 'PENDING' } });
    if (!as) throw new BadRequestException('当前售后状态无法开启小法庭');
    return this.openCase(as, 'shop');
  }

  private async openCase(as: any, initiator: string) {
    const existing = await prisma.courtCase.findFirst({ where: { afterSaleId: as.id } });
    if (existing) throw new BadRequestException('该售后已有小法庭案件');

    const highAmount = Number(as.amount) >= ADMIN_REVIEW_AMOUNT;
    const status = highAmount ? 'ADMIN_REVIEW' : 'JUDGING';
    const caseNo = `FT${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const deadline = new Date(Date.now() + CASE_HOURS * 60 * 60 * 1000).toISOString();

    const courtCase = await prisma.courtCase.create({
      data: {
        caseNo,
        afterSaleId: as.id,
        initiator,
        status,
        judgeCount: JUDGE_COUNT,
        voteDeadline: deadline,
        openedAt: new Date().toISOString(),
      },
    });

    await prisma.afterSale.update({
      where: { id: as.id },
      data: { status: highAmount ? 'COURT_ADMIN_REVIEW' : 'COURT_JUDGING' },
    });
    await prisma.afterSaleLog.create({
      data: {
        afterSaleId: as.id,
        operator: initiator === 'buyer' ? 'user' : 'shop_owner',
        action: 'arbitrate',
        remark: `开启小法庭：${caseNo}`,
      },
    });

    await this.notificationsService.create(as.userId, 'court', '小法庭已开启', `案件 ${caseNo} 已进入小法庭，请及时提交证据`, as.id);
    const members = await prisma.shopMember.findMany({ where: { shopId: as.shopId } });
    for (const m of members) {
      await this.notificationsService.create(m.userId, 'court', '小法庭已开启', `案件 ${caseNo} 已进入小法庭，请及时提交证据`, as.id);
    }
    return courtCase;
  }

  async lobby(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const statuses = ['JUDGING', 'ADMIN_REVIEW'];
    const [rows, total] = await Promise.all([
      prisma.courtCase.findMany({ where: { status: { in: statuses } }, orderBy: { openedAt: 'desc' }, skip, take: pageSize }),
      prisma.courtCase.count({ where: { status: { in: statuses } } }),
    ]);
    const data: any[] = [];
    for (const c of rows) {
      data.push(await this.toLobbyItem(c));
    }
    return { data, total, page, pageSize };
  }

  async myCases(userId: number, shopId?: number) {
    const all = await prisma.courtCase.findMany({ orderBy: { openedAt: 'desc' } });
    const result: any[] = [];
    for (const c of all) {
      const as = await prisma.afterSale.findUnique({ where: { id: c.afterSaleId } });
      if (!as) continue;
      if (as.userId === userId || (shopId && as.shopId === shopId)) {
        result.push(await this.toLobbyItem(c));
      }
    }
    return result;
  }

  async detail(caseId: number, userId?: number) {
    const c = await prisma.courtCase.findUnique({ where: { id: caseId } });
    if (!c) throw new NotFoundException('小法庭案件不存在');

    const as = await prisma.afterSale.findUnique({ where: { id: c.afterSaleId } });
    const order = as ? await prisma.order.findUnique({ where: { id: as.orderId } }) : null;
    const shop = as ? await prisma.shop.findUnique({ where: { id: as.shopId } }) : null;
    const buyer = as ? await prisma.user.findUnique({ where: { id: as.userId } }) : null;
    const votes = await prisma.courtVote.findMany({ where: { caseId: c.id } });
    const voteRows: any[] = [];
    for (const v of votes) {
      const user = await prisma.user.findUnique({ where: { id: v.userId } });
      voteRows.push({ ...v, user: user ? { id: user.id, nickname: user.nickname, avatar: user.avatar } : null });
    }

    let myVote = null;
    let canVote = false;
    let voteReason = '';
    if (userId) {
      myVote = await prisma.courtVote.findFirst({ where: { caseId: c.id, userId } });
      const check = await this.voteEligibility(userId, c);
      canVote = check.ok;
      voteReason = check.reason || '';
    }

    return {
      ...c,
      afterSale: as,
      order,
      shop,
      buyer,
      votes: voteRows,
      buyerVotes: voteRows.filter((v) => v.side === 'buyer').length,
      shopVotes: voteRows.filter((v) => v.side === 'shop').length,
      myVote,
      canVote,
      voteReason,
    };
  }

  async submitEvidence(caseId: number, userId: number, body: any) {
    const c = await prisma.courtCase.findUnique({ where: { id: caseId } });
    if (!c) throw new NotFoundException('小法庭案件不存在');
    if (c.status !== 'JUDGING' && c.status !== 'ADMIN_REVIEW') {
      throw new BadRequestException('案件当前不可提交证据');
    }
    const as = await prisma.afterSale.findUnique({ where: { id: c.afterSaleId } });
    if (!as) throw new NotFoundException('售后记录不存在');

    const isBuyer = as.userId === userId;
    const members = await prisma.shopMember.findMany({ where: { shopId: as.shopId } });
    const isShop = members.some((m) => m.userId === userId);
    if (!isBuyer && !isShop) throw new ForbiddenException('只有案件双方可以提交证据');

    const isRebuttal = Boolean(body.rebuttal);
    const openedAt = new Date(c.openedAt).getTime();
    const hours = isRebuttal ? REBUTTAL_HOURS : EVIDENCE_HOURS;
    if (Date.now() > openedAt + hours * 60 * 60 * 1000) {
      throw new BadRequestException(isRebuttal ? '反驳提交时间已过' : '证据提交时间已过');
    }

    const data: any = {};
    if (isRebuttal) {
      if (isBuyer) data.buyerRebuttal = body.content || '';
      else data.shopRebuttal = body.content || '';
    } else if (isBuyer) {
      data.buyerStatement = body.statement || '';
      if (Array.isArray(body.images)) data.buyerEvidence = JSON.stringify(body.images);
    } else {
      data.shopStatement = body.statement || '';
      if (Array.isArray(body.images)) data.shopEvidence = JSON.stringify(body.images);
    }

    await prisma.courtCase.update({ where: { id: caseId }, data });
    return this.detail(caseId, userId);
  }

  async vote(caseId: number, userId: number, side: string, comment?: string) {
    const c = await prisma.courtCase.findUnique({ where: { id: caseId } });
    if (!c) throw new NotFoundException('小法庭案件不存在');
    if (c.status !== 'JUDGING') throw new BadRequestException('案件不在投票中');
    if (Date.now() > new Date(c.voteDeadline).getTime()) throw new BadRequestException('投票已截止');
    if (side !== 'buyer' && side !== 'shop') throw new BadRequestException('无效的投票选择');

    const check = await this.voteEligibility(userId, c);
    if (!check.ok) throw new ForbiddenException(check.reason || '当前账号没有投票资格');

    const existing = await prisma.courtVote.findFirst({ where: { caseId: c.id, userId } });
    if (existing) throw new BadRequestException('你已经投过票');

    await prisma.courtVote.create({ data: { caseId: c.id, userId, side, comment: comment || '' } });
    await this.trySettle(c.id);
    return this.detail(caseId, userId);
  }

  private async voteEligibility(userId: number, c: any): Promise<{ ok: boolean; reason?: string }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'active') return { ok: false, reason: '账号状态异常' };

    const roles = await prisma.userRole.findMany({ where: { userId } });
    const roleNames = roles.map((r) => r.role);
    if (!roleNames.includes('buyer')) return { ok: false, reason: '仅买家账号可以参与投票' };
    if (roleNames.some((r) => ['super_admin', 'business_admin', 'cs_admin'].includes(r))) {
      return { ok: false, reason: '管理员账号不能参与投票' };
    }
    if (roleNames.some((r) => ['shop_owner', 'shop_cs', 'shop_warehouse'].includes(r))) {
      return { ok: false, reason: '商家账号不能参与投票' };
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (new Date(user.createdAt).getTime() > sevenDaysAgo.getTime()) {
      return { ok: false, reason: '注册未满 7 天' };
    }
    const completed = await prisma.order.count({ where: { userId, status: 'COMPLETED' } });
    if (!completed) return { ok: false, reason: '需要至少一笔已完成订单' };

    const as = await prisma.afterSale.findUnique({ where: { id: c.afterSaleId } });
    if (!as) return { ok: false, reason: '案件数据异常' };
    if (as.userId === userId) return { ok: false, reason: '案件当事人不能投票' };
    const members = await prisma.shopMember.findMany({ where: { shopId: as.shopId } });
    if (members.some((m) => m.userId === userId)) return { ok: false, reason: '涉案商家成员不能投票' };
    return { ok: true };
  }

  async trySettle(caseId: number) {
    const c = await prisma.courtCase.findUnique({ where: { id: caseId } });
    if (!c || c.status !== 'JUDGING') return;

    const votes = await prisma.courtVote.findMany({ where: { caseId: c.id } });
    const buyerVotes = votes.filter((v) => v.side === 'buyer').length;
    const shopVotes = votes.length - buyerVotes;
    const gap = Math.abs(buyerVotes - shopVotes);
    const expired = Date.now() > new Date(c.voteDeadline).getTime();

    if (votes.length >= c.judgeCount && gap >= 2) {
      const winner = buyerVotes > shopVotes ? 'buyer' : 'shop';
      await this.closeCase(c.id, winner === 'buyer' ? 'CLOSED_BUYER_WIN' : 'CLOSED_SHOP_WIN', winner);
      return;
    }
    if (expired) {
      await this.toAdminReview(c.id);
    }
  }

  private async closeCase(caseId: number, status: string, winner: string) {
    const c = await prisma.courtCase.findUnique({ where: { id: caseId } });
    if (!c || c.status !== 'JUDGING') return;
    const as = await prisma.afterSale.findUnique({ where: { id: c.afterSaleId } });

    await prisma.courtCase.update({ where: { id: caseId }, data: { status, closedAt: new Date().toISOString() } });
    if (as) {
      await prisma.afterSale.update({
        where: { id: as.id },
        data: { status: winner === 'buyer' ? 'REFUNDED' : 'CLOSED', resolvedAt: new Date().toISOString() },
      });
      await prisma.afterSaleLog.create({
        data: { afterSaleId: as.id, operator: 'system', action: 'resolve', remark: `小法庭裁决：${winner === 'buyer' ? '支持买家' : '支持商家'}` },
      });
      if (winner === 'buyer') {
        await prisma.order.update({ where: { id: as.orderId }, data: { status: 'REFUNDED' } });
      }
      await this.notificationsService.create(as.userId, 'court', '小法庭已裁决', `案件 ${c.caseNo} 裁决：${winner === 'buyer' ? '支持买家' : '支持商家'}`, as.id);
    }
    await this.rewardVoters(caseId, winner, c.caseNo);
  }

  private async toAdminReview(caseId: number) {
    const c = await prisma.courtCase.findUnique({ where: { id: caseId } });
    if (!c || c.status !== 'JUDGING') return;
    await prisma.courtCase.update({ where: { id: caseId }, data: { status: 'ADMIN_REVIEW' } });
    const as = await prisma.afterSale.findUnique({ where: { id: c.afterSaleId } });
    if (as) {
      await prisma.afterSale.update({ where: { id: as.id }, data: { status: 'COURT_ADMIN_REVIEW' } });
      await prisma.afterSaleLog.create({ data: { afterSaleId: as.id, operator: 'system', action: 'resolve', remark: '小法庭票数不足或票数接近，转管理员复核' } });
    }
  }

  async adminReviewList(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [rows, total] = await Promise.all([
      prisma.courtCase.findMany({ where: { status: 'ADMIN_REVIEW' }, orderBy: { openedAt: 'desc' }, skip, take: pageSize }),
      prisma.courtCase.count({ where: { status: 'ADMIN_REVIEW' } }),
    ]);
    const data: any[] = [];
    for (const c of rows) {
      data.push(await this.toLobbyItem(c));
    }
    return { data, total, page, pageSize };
  }

  async adminDecision(caseId: number, decision: string, remark?: string) {
    const c = await prisma.courtCase.findUnique({ where: { id: caseId } });
    if (!c || c.status !== 'ADMIN_REVIEW') throw new BadRequestException('案件当前不能复核');

    let newStatus: string;
    let winner: string;
    if (decision === 'refund') { newStatus = 'ADMIN_REFUND'; winner = 'buyer'; }
    else if (decision === 'reject') { newStatus = 'ADMIN_REJECT'; winner = 'shop'; }
    else if (decision === 'partial') { newStatus = 'ADMIN_PARTIAL'; winner = 'buyer'; }
    else throw new BadRequestException('无效的复核决定');

    await prisma.courtCase.update({
      where: { id: caseId },
      data: { status: newStatus, adminDecision: decision, adminRemark: remark || '', closedAt: new Date().toISOString() },
    });
    const as = await prisma.afterSale.findUnique({ where: { id: c.afterSaleId } });
    if (as) {
      await prisma.afterSale.update({ where: { id: as.id }, data: { status: newStatus, resolvedAt: new Date().toISOString() } });
      await prisma.afterSaleLog.create({ data: { afterSaleId: as.id, operator: 'admin', action: 'resolve', remark: remark || `管理员复核：${decision}` } });
      if (decision === 'refund' || decision === 'partial') {
        await prisma.order.update({ where: { id: as.orderId }, data: { status: 'REFUNDED' } });
      }
      await this.notificationsService.create(as.userId, 'court', '小法庭复核完成', `案件 ${c.caseNo} 复核结果：${remark || decision}`, as.id);
    }
    await this.rewardVoters(caseId, winner, c.caseNo);
    return this.detail(caseId);
  }

  private async rewardVoters(caseId: number, winner: string, caseNo: string) {
    const votes = await prisma.courtVote.findMany({ where: { caseId, side: winner } });
    for (const v of votes) {
      const key = `reward-${caseId}-${v.userId}`;
      const existing = await prisma.tokenTransaction.findFirst({ where: { uniqueKey: key } });
      if (existing) continue;
      let account = await prisma.courtTokenAccount.findFirst({ where: { userId: v.userId } });
      if (!account) {
        account = await prisma.courtTokenAccount.create({ data: { userId: v.userId, balance: 0, totalEarned: 0 } });
      }
      await prisma.courtTokenAccount.update({
        where: { userId: v.userId },
        data: { balance: { increment: REWARD_PER_CORRECT_VOTE }, totalEarned: { increment: REWARD_PER_CORRECT_VOTE } },
      });
      await prisma.tokenTransaction.create({
        data: { userId: v.userId, type: 'court_reward', amount: REWARD_PER_CORRECT_VOTE, uniqueKey: key, caseId },
      });
      await this.notificationsService.create(v.userId, 'token', '小法庭奖励到账', `案件 ${caseNo} 你的判断正确，获得 ${REWARD_PER_CORRECT_VOTE} 法庭币`, caseId);
    }
  }

  private async toLobbyItem(c: any) {
    const as = await prisma.afterSale.findUnique({ where: { id: c.afterSaleId } });
    const shop = as ? await prisma.shop.findUnique({ where: { id: as.shopId } }) : null;
    const orderItems = as ? await prisma.orderItem.findMany({ where: { orderId: as.orderId }, take: 1 }) : [];
    const votes = await prisma.courtVote.count({ where: { caseId: c.id } });
    return {
      ...c,
      afterSale: as ? { id: as.id, amount: as.amount, reason: as.reason, type: as.type, status: as.status } : null,
      shop: shop ? { id: shop.id, name: shop.name, logo: shop.logo } : null,
      productName: orderItems[0]?.productName || '',
      votes,
    };
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCourtAutoTasks() {
    const rows = await prisma.courtCase.findMany({ where: { status: 'JUDGING' } });
    for (const c of rows) {
      try {
        await this.trySettle(c.id);
      } catch (e) {
        console.error(`Court settle failed for case ${c.id}:`, e);
      }
    }
  }
}
