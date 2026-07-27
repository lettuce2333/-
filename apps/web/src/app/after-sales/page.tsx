'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, Badge } from '@zuoye/ui';
import { toast } from '@/components/toaster';

const statusLabels: Record<string, string> = {
  PENDING: '待商家审核', SHOP_APPROVED: '商家已同意', SHOP_REFUSED: '商家已拒绝',
  AUTO_APPROVED: '系统已同意', WAITING_RETURN: '等待寄回', BUYER_SHIPPED: '已寄回',
  SHOP_RECEIVED: '商家已收货', REFUNDED: '已退款', DISPUTE: '申诉中',
  ADMIN_REFUND: '管理员判定退款', ADMIN_REJECT: '管理员驳回', CLOSED: '已关闭',
};

export default function AfterSalesPage() {
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const orderId = useSearchParams().get('orderId');
  const [form, setForm] = useState({ orderId: orderId || '', type: 'refund_only' as const, reason: '', amount: '' });

  useEffect(() => { if (!user) { router.push('/login'); return; }
    api.get('/after-sales').then((res) => { setItems(res.data || []); setLoading(false); });
  }, [user, router]);

  const submitAfterSale = async () => {
    if (!form.orderId || !form.reason || !form.amount) { toast('请填写完整信息', 'error'); return; }
    try {
      await api.post('/after-sales', { ...form, amount: parseFloat(form.amount) });
      toast('提交成功', 'success'); setShowForm(false); window.location.reload();
    } catch (err: any) { toast(err.message, 'error'); }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--color-ink)]">售后服务</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>申请售后</Button>
      </div>

      {showForm && (
        <Card className="mb-5 overflow-hidden">
          <div className="px-5 py-4 space-y-4">
            <input placeholder="订单ID" className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)]" value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })} />
            <select className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)]" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
              <option value="refund_only">仅退款</option>
              <option value="return_refund">退货退款</option>
            </select>
            <textarea placeholder="退款原因" className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)]" rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            <input placeholder="退款金额" type="number" className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)]" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Button onClick={submitAfterSale}>提交申请</Button>
          </div>
        </Card>
      )}

      {loading ? <div className="h-32 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-2)]" /> : items.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-4xl mb-3 opacity-40">🔧</p>
          <p className="text-[var(--color-muted)]">暂无售后记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link key={item.id} href={`/after-sales/${item.id}`}>
              <Card accent className="px-5 py-4 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-ink)]">{item.type === 'refund_only' ? '仅退款' : '退货退款'} — &yen;{item.amount}</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">订单：{item.order?.orderNo}</p>
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">申请时间：{new Date(item.appliedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={item.status === 'REFUNDED' ? 'success' : item.status === 'PENDING' ? 'warning' : item.status === 'DISPUTE' ? 'danger' : 'info'}>
                      {statusLabels[item.status] || item.status}
                    </Badge>
                    <span className="text-[var(--color-muted)] group-hover:text-[var(--color-accent)] transition-colors">&rarr;</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
