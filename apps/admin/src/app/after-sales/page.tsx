'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card, Badge } from '@zuoye/ui';
import { toast } from '@/components/toaster';
import { AdminLayout } from '@/components/admin-layout';

export default function AdminAfterSalesPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ id: number; decision: string; remark: string } | null>(null);

  const load = () => api.get('/admin/after-sales/pending').then((res) => { setItems(res.data || []); setLoading(false); });
  useEffect(() => { if (!localStorage.getItem('token')) { router.push('/login'); return; } load(); }, [router]);

  const handleArbitrate = async () => {
    if (!selected) return;
    try {
      await api.post(`/admin/after-sales/${selected.id}/arbitrate`, { decision: selected.decision, remark: selected.remark });
      toast('仲裁完成', 'success'); setSelected(null); load();
    } catch (err: any) { toast(err.message, 'error'); }
  };

  return (
    <AdminLayout title="售后仲裁">
      <div className="p-6">
        {selected && (
          <Card className="mb-5 p-6">
            <h2 className="mb-4 font-medium text-[var(--color-ink)]">仲裁处理 #{selected.id}</h2>
            <div className="space-y-3">
              <select className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)]" value={selected.decision} onChange={(e) => setSelected({ ...selected, decision: e.target.value })}>
                <option value="">请选择</option>
                <option value="refund">判定退款</option>
                <option value="reject">驳回申请</option>
                <option value="partial">部分退款</option>
              </select>
              <input className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)]" placeholder="备注" value={selected.remark} onChange={(e) => setSelected({ ...selected, remark: e.target.value })} />
              <div className="flex gap-2">
                <Button onClick={handleArbitrate}>提交仲裁</Button>
                <Button variant="outline" onClick={() => setSelected(null)}>取消</Button>
              </div>
            </div>
          </Card>
        )}

        {loading ? <div className="h-32 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-2)]" /> : items.length === 0 ? (
          <div className="py-20 text-center text-[var(--color-muted)]">暂无待仲裁售后</div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} accent className="px-5 py-4">
                <div className="flex items-start justify-between">
                  <div className="text-sm">
                    <p className="font-medium text-[var(--color-ink)]">用户 {item.user?.nickname} — {item.type === 'refund_only' ? '仅退款' : '退货退款'} &yen;{item.amount}</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">店铺：{item.shop?.name} | 订单：{item.order?.orderNo}</p>
                    <p className="text-xs text-[var(--color-muted)]">原因：{item.reason}</p>
                    <p className="mt-2 text-xs text-[var(--color-ink)] font-medium">处理记录：</p>
                    {item.logs?.map((log: any) => (
                      <p key={log.id} className="text-xs text-[var(--color-muted)]">— {log.action}: {log.remark} ({new Date(log.createdAt).toLocaleString()})</p>
                    ))}
                  </div>
                  <Badge variant="danger">申诉中</Badge>
                </div>
                <Button size="sm" className="mt-3" onClick={() => setSelected({ id: item.id, decision: '', remark: '' })}>处理</Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
