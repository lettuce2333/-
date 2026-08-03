'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, Badge, Pagination } from '@zuoye/ui';
import { toast } from '@/components/toaster';

const statusMap: Record<string, string> = {
  PENDING_PAYMENT: '待付款', PAID: '已付款', SHIPPED: '已发货',
  DELIVERED: '已送达', RECEIVED: '已收货', COMPLETED: '已完成',
  CANCELLED: '已取消', REFUNDED: '已退款',
};

const statusColors: Record<string, string> = {
  PENDING_PAYMENT: 'warning', PAID: 'info', SHIPPED: 'info',
  RECEIVED: 'success', COMPLETED: 'success', CANCELLED: 'default', REFUNDED: 'default',
};

export default function OrdersPage() {
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [afterSale, setAfterSale] = useState<{ orderId: number; orderNo: string; amount: number; reason: string } | null>(null);

  const hasAfterSale = (order: any) => order.afterSales?.some((a: any) => !['REFUNDED','CLOSED','ADMIN_REJECT','SHOP_REFUSED'].includes(a.status));
  const refusedAfterSale = (order: any) => order.afterSales?.find((a: any) => a.status === 'SHOP_REFUSED');
  const courtAfterSale = (order: any) => order.afterSales?.find((a: any) => a.status === 'COURT_JUDGING' || a.status === 'COURT_ADMIN_REVIEW');
  const showStatus = (order: any) => hasAfterSale(order) ? '售后中' : statusMap[order.status];
  const showColor = (order: any) => hasAfterSale(order) ? 'warning' : statusColors[order.status];

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    const params = new URLSearchParams({ page: String(page), pageSize: '10' });
    if (statusFilter) params.set('status', statusFilter);
    api.get(`/orders?${params}`).then((res: any) => {
      setOrders(res.data || []);
      setTotal(res.total || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, router, statusFilter, page]);

  const handlePay = async (id: number) => {
    try {
      await api.post(`/orders/${id}/pay`);
      toast('支付成功', 'success');
      setOrders(orders.map((o) => o.id === id ? { ...o, status: 'PAID' } : o));
    } catch (err: any) { toast(err.message, 'error'); }
  };

  const handleReceive = async (id: number) => {
    try {
      await api.post(`/orders/${id}/receive`);
      toast('已确认收货', 'success');
      setOrders(orders.map((o) => o.id === id ? { ...o, status: 'RECEIVED' } : o));
    } catch (err: any) { toast(err.message, 'error'); }
  };

  const handleAfterSale = async () => {
    if (!afterSale || !afterSale.reason) { toast('请填写申请原因', 'error'); return; }
    try {
      await api.post('/after-sales', { orderId: afterSale.orderId, type: 'refund_only', reason: afterSale.reason, amount: afterSale.amount });
      toast('售后申请已提交', 'success');
      setAfterSale(null);
    } catch (err: any) { toast(err.message, 'error'); }
  };

  const handleOpenCourt = async (id: number) => {
    try {
      await api.post(`/after-sales/${id}/court-open`);
      toast('小法庭已开启', 'success');
      window.location.reload();
    } catch (err: any) { toast(err.message, 'error'); }
  };

  const handleCancel = async (id: number) => {
    try {
      await api.post(`/orders/${id}/cancel`, { reason: '用户取消' });
      toast('已取消', 'success');
      setOrders(orders.map((o) => o.id === id ? { ...o, status: 'CANCELLED' } : o));
    } catch (err: any) { toast(err.message, 'error'); }
  };

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-8"><div className="h-48 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-2)]" /></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-[var(--color-ink)]">我的订单</h1>
        <span className="text-sm text-[var(--color-muted)]">共 {total} 笔</span>
      </div>
      <div className="mb-5 flex flex-wrap gap-1.5 bg-[var(--color-surface)] rounded-[var(--radius-sm)] border border-[var(--color-border-light)] p-0.5">
        {['', 'PENDING_PAYMENT', 'PAID', 'SHIPPED', 'RECEIVED', 'AFTER_SALE', 'COMPLETED', 'CANCELLED'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-[var(--radius-sm)] transition-all duration-150 ${statusFilter === s ? 'bg-[var(--color-accent)] text-white shadow-sm' : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'}`}>
            {s === 'AFTER_SALE' ? '售后中' : s ? statusMap[s] : '全部'}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-4xl mb-3 opacity-40">📋</p>
          <p className="text-[var(--color-muted)]">暂无订单</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.filter((o) => statusFilter === 'AFTER_SALE' ? hasAfterSale(o) : true).map((order) => (
            <Card key={order.id} accent>
              <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-5 py-3">
                <span className="text-xs text-[var(--color-muted)] font-mono">{order.orderNo}</span>
                <Badge variant={(showColor(order) || 'default') as any}>{showStatus(order)}</Badge>
              </div>
              <div className="px-5 py-3">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 py-2">
                    <div className="h-14 w-14 flex-shrink-0 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)]/40">📦</div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.productId}`} className="text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-accent)] transition-colors line-clamp-1">
                        {item.productName}
                      </Link>
                      <p className="text-xs text-[var(--color-muted)] mt-0.5">&yen;{item.unitPrice} x {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-[var(--color-accent)]">&yen;{item.subtotal}</p>
                  </div>
                ))}
              </div>
              {order.logistics && (
                <div className="border-t border-[var(--color-border-light)] px-5 py-2 text-xs text-[var(--color-muted)]">
                  物流：{order.logistics.company} · {order.logistics.trackingNo}
                </div>
              )}
              <div className="flex items-center justify-between border-t border-[var(--color-border-light)] px-5 py-3">
                <span className="text-sm text-[var(--color-muted)]">共 {order.items?.length || 0} 件 合计：<span className="font-bold text-[var(--color-accent)]">&yen;{order.totalAmount}</span></span>
                <div className="flex gap-2">
                  <Link href={`/orders/${order.id}`}><Button variant="outline" size="sm">查看详情</Button></Link>
                  {order.status === 'PENDING_PAYMENT' && (
                    <><Button size="sm" onClick={() => handlePay(order.id)}>去支付</Button><Button variant="ghost" size="sm" onClick={() => handleCancel(order.id)}>取消</Button></>
                  )}
                  {order.status === 'SHIPPED' && <Button size="sm" onClick={() => handleReceive(order.id)}>确认收货</Button>}
                  {refusedAfterSale(order) && <Button size="sm" onClick={() => handleOpenCourt(refusedAfterSale(order).id)}>开启小法庭</Button>}
                  {courtAfterSale(order)?.courtCase && <Link href={`/court/${courtAfterSale(order).courtCase.id}`}><Button variant="outline" size="sm">查看小法庭案件</Button></Link>}
                  {order.status === 'RECEIVED' && !hasAfterSale(order) && !refusedAfterSale(order) && <Button variant="outline" size="sm" onClick={() => setAfterSale({ orderId: order.id, orderNo: order.orderNo, amount: order.totalAmount, reason: '' })}>申请售后</Button>}
                </div>
              </div>
            </Card>
          ))}
          <Pagination page={page} pageCount={Math.ceil(total / 10)} total={total} onChange={setPage} />
        </div>
      )}

      {afterSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg">
            <h3 className="text-lg font-bold mb-4">申请售后</h3>
            <p className="text-sm text-gray-500 mb-3">订单号：{afterSale.orderNo}</p>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">退款金额</label><input type="number" className="w-full rounded-lg border px-3 py-2" value={afterSale.amount} onChange={(e) => setAfterSale({ ...afterSale, amount: parseFloat(e.target.value) || 0 })} /></div>
              <div><label className="block text-sm font-medium mb-1">申请原因</label><textarea className="w-full rounded-lg border px-3 py-2" rows={3} value={afterSale.reason} onChange={(e) => setAfterSale({ ...afterSale, reason: e.target.value })} placeholder="请描述退款原因" /></div>
            </div>
            <div className="mt-5 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setAfterSale(null)}>取消</Button>
              <Button onClick={handleAfterSale}>提交申请</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
