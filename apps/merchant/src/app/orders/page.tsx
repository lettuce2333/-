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
  const [shipDialog, setShipDialog] = useState<{ id: number; company: string; trackingNo: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    const params = filter ? `?status=${filter}` : '';
    api.get(`/merchant/orders${params}`).then((res) => { setOrders(res.data || []); setLoading(false); });
  }, [router, filter]);

  const handleShip = async () => {
    if (!shipDialog) return;
    try {
      await api.post(`/merchant/orders/${shipDialog.id}/ship`, {
        company: shipDialog.company || undefined,
        trackingNo: shipDialog.trackingNo || undefined,
      });
      toast('发货成功', 'success');
      setShipDialog(null);
      window.location.reload();
    } catch (err: any) { toast(err.message, 'error'); }
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
                    {order.status === 'PAID' && <Button size="sm" onClick={() => setShipDialog({ id: order.id, company: '', trackingNo: '' })}>发货</Button>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Shipping Dialog */}
      {shipDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg">
            <h3 className="text-lg font-bold mb-4">填写物流信息</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">快递公司</label>
                <select className="w-full rounded-lg border px-3 py-2" value={shipDialog.company} onChange={(e) => setShipDialog({ ...shipDialog, company: e.target.value })}>
                  <option value="">-- 选择快递 --</option>
                  <option value="顺丰速运">顺丰速运</option>
                  <option value="圆通速递">圆通速递</option>
                  <option value="中通快递">中通快递</option>
                  <option value="韵达快递">韵达快递</option>
                  <option value="申通快递">申通快递</option>
                  <option value="极兔速递">极兔速递</option>
                  <option value="EMS">EMS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">快递单号</label>
                <input className="w-full rounded-lg border px-3 py-2" placeholder="留空自动生成" value={shipDialog.trackingNo} onChange={(e) => setShipDialog({ ...shipDialog, trackingNo: e.target.value })} />
              </div>
            </div>
            <div className="mt-5 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShipDialog(null)}>取消</Button>
              <Button onClick={handleShip} disabled={!shipDialog.company}>确认发货</Button>
            </div>
          </div>
        </div>
      )}
    </MerchantLayout>
  );
}
