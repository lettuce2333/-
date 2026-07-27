'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card, Badge } from '@zuoye/ui';
import { toast } from '@/components/toaster';
import { MerchantLayout } from '@/components/merchant-layout';

const sm: Record<string, string> = {
  PENDING_PAYMENT: '待付款', PAID: '待发货', SHIPPED: '已发货',
  DELIVERED: '已送达', RECEIVED: '已收货', COMPLETED: '已完成',
  CANCELLED: '已取消', REFUNDED: '已退款',
};

export default function MerchantOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    const params = filter ? `?status=${filter}` : '';
    api.get(`/merchant/orders${params}`).then((res) => { setOrders(res.data || []); setLoading(false); });
  }, [router, filter]);

  const handleShip = async (id: number) => {
    try { await api.post(`/merchant/orders/${id}/ship`); toast('发货成功', 'success'); window.location.reload(); } catch (err: any) { toast(err.message, 'error'); }
  };

  const filters = ['', 'PAID', 'SHIPPED', 'RECEIVED', 'CANCELLED', 'REFUNDED'];

  return (
    <MerchantLayout title="订单管理">
      <div className="p-6">
        <div className="mb-4 flex flex-wrap gap-1.5 bg-[var(--color-surface)] rounded-[var(--radius-sm)] border border-[var(--color-border-light)] p-0.5">
          {filters.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-[var(--radius-sm)] transition-all duration-150 ${filter === f ? 'bg-[var(--color-accent)] text-white shadow-sm' : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'}`}>
              {f ? sm[f] : '全部'}
            </button>
          ))}
        </div>
        {loading ? <div className="h-48 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-2)]" /> : orders.length === 0 ? (
          <div className="py-20 text-center text-[var(--color-muted)]">暂无订单</div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.id} accent>
                <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-5 py-3">
                  <span className="text-xs text-[var(--color-muted)] font-mono">{order.orderNo}</span>
                  <Badge variant={order.status === 'PAID' ? 'warning' : order.status === 'SHIPPED' ? 'info' : order.status === 'COMPLETED' ? 'success' : 'default'}>
                    {sm[order.status] || order.status}
                  </Badge>
                </div>
                <div className="px-5 py-3">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between py-1 text-sm">
                      <span className="text-[var(--color-ink)]">{item.productName} x{item.quantity}</span>
                      <span className="text-[var(--color-accent)] font-medium">&yen;{item.subtotal}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-[var(--color-border-light)] px-5 py-3">
                  <span className="text-sm text-[var(--color-muted)]">合计：<span className="font-bold text-[var(--color-ink)]">&yen;{order.totalAmount}</span></span>
                  <div className="flex gap-2">
                    {order.status === 'PAID' && <Button size="sm" onClick={() => handleShip(order.id)}>发货</Button>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MerchantLayout>
  );
}
