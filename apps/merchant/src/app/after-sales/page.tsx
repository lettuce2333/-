'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card, Badge } from '@zuoye/ui';
import { toast } from '@/components/toaster';

const sl: Record<string, string> = {
  PENDING: '待审核', SHOP_APPROVED: '已同意', SHOP_REFUSED: '已拒绝',
  AUTO_APPROVED: '系统同意', WAITING_RETURN: '等待寄回', BUYER_SHIPPED: '已寄回',
  SHOP_RECEIVED: '已收货', REFUNDED: '已退款', DISPUTE: '申诉中',
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

  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-bold">售后管理</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        {['', 'PENDING', 'BUYER_SHIPPED', 'REFUNDED', 'DISPUTE'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-sm ${filter === f ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
            {f ? sl[f] : '全部'}
          </button>
        ))}
      </div>
      {loading ? <div className="h-32 animate-pulse rounded-lg bg-gray-200" /> : items.length === 0 ? (
        <div className="py-20 text-center text-gray-400">暂无售后记录</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <p>用户：{item.user?.nickname} | {item.type === 'refund_only' ? '仅退款' : '退货退款'} ￥{item.amount}</p>
                  <p className="mt-1 text-xs text-gray-400">原因：{item.reason}</p>
                  <p className="text-xs text-gray-400">{new Date(item.appliedAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.status === 'PENDING' ? 'warning' : item.status === 'REFUNDED' ? 'success' : 'info'}>{sl[item.status]}</Badge>
                  {item.status === 'PENDING' && <><Button size="sm" onClick={() => handleApprove(item.id)}>同意</Button><Button size="sm" variant="outline" onClick={() => handleRefuse(item.id)}>拒绝</Button></>}
                  {item.status === 'BUYER_SHIPPED' && <Button size="sm" onClick={() => handleReceive(item.id)}>确认收货</Button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
