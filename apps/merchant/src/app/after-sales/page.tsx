'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button, Card, Badge } from '@zuoye/ui';
import { toast } from '@/components/toaster';
import { MerchantLayout } from '@/components/merchant-layout';

const sl: Record<string, string> = {
  PENDING: '待审核', SHOP_APPROVED: '已同意', SHOP_REFUSED: '已拒绝',
  AUTO_APPROVED: '系统同意', WAITING_RETURN: '等待寄回', BUYER_SHIPPED: '已寄回',
  SHOP_RECEIVED: '已收货', REFUNDED: '已退款', DISPUTE: '申诉中',
  COURT_JUDGING: '小法庭投票中', COURT_ADMIN_REVIEW: '小法庭复核中',
};

export default function MerchantAfterSalesPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    const p = filter ? `?status=${filter}` : '';
    api.get(`/merchant/after-sales${p}`).then((res) => { setItems(res.data || []); setLoading(false); });
  }, [router, filter]);

  const handleApprove = async (id: number) => {
    try { await api.post(`/merchant/after-sales/${id}/approve`); toast('已同意', 'success'); window.location.reload(); } catch (err: any) { toast(err.message, 'error'); }
  };
  const handleRefuse = async (id: number) => {
    try { await api.post(`/merchant/after-sales/${id}/refuse`, { remark: '拒绝理由' }); toast('已拒绝', 'success'); window.location.reload(); } catch (err: any) { toast(err.message, 'error'); }
  };
  const handleReceive = async (id: number) => {
    try { await api.post(`/merchant/after-sales/${id}/receive`); toast('已收货', 'success'); window.location.reload(); } catch (err: any) { toast(err.message, 'error'); }
  };
  const handleOpenCourt = async (id: number) => {
    try { await api.post(`/merchant/after-sales/${id}/court-open`); toast('小法庭已开启', 'success'); window.location.reload(); } catch (err: any) { toast(err.message, 'error'); }
  };

  return (
    <MerchantLayout title="售后管理">
      <div className="p-6">
        <div className="mb-4 flex flex-wrap gap-1.5 bg-[var(--color-surface)] rounded-[var(--radius-sm)] border border-[var(--color-border-light)] p-0.5">
          {['', 'PENDING', 'BUYER_SHIPPED', 'REFUNDED', 'DISPUTE', 'COURT_JUDGING'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-[var(--radius-sm)] transition-all duration-150 ${filter === f ? 'bg-[var(--color-accent)] text-white shadow-sm' : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'}`}>
              {f ? sl[f] : '全部'}
            </button>
          ))}
        </div>
        {loading ? <div className="h-32 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-2)]" /> : items.length === 0 ? (
          <div className="py-20 text-center text-[var(--color-muted)]">暂无售后记录</div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} accent className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <p className="text-[var(--color-ink)]">用户：{item.user?.nickname} | {item.type === 'refund_only' ? '仅退款' : '退货退款'} &yen;{item.amount}</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">原因：{item.reason}</p>
                    <p className="text-xs text-[var(--color-muted)]">{new Date(item.appliedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.status === 'PENDING' ? 'warning' : item.status === 'REFUNDED' ? 'success' : 'info'}>{sl[item.status]}</Badge>
                    {item.status === 'PENDING' && <>
                      <Button size="sm" onClick={() => handleApprove(item.id)}>同意</Button>
                      <Button size="sm" variant="outline" onClick={() => handleRefuse(item.id)}>拒绝</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleOpenCourt(item.id)}>开启小法庭</Button>
                    </>}
                    {item.status === 'BUYER_SHIPPED' && <Button size="sm" onClick={() => handleReceive(item.id)}>确认收货</Button>}
                    {item.courtCase && <Link href={`/court/${item.courtCase.id}`}><Button size="sm" variant="outline">查看案件</Button></Link>}
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
