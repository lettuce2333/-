'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card, Badge } from '@zuoye/ui';
import { toast } from '@/components/toaster';

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
    <div className="p-6">
      <h1 className="mb-4 text-lg font-bold">售后仲裁</h1>

      {selected && (
        <Card className="mb-4 p-6">
          <h2 className="mb-3 font-medium">仲裁处理 #{selected.id}</h2>
          <div className="space-y-3">
            <select className="w-full rounded-lg border px-3 py-2 text-sm" value={selected.decision} onChange={(e) => setSelected({ ...selected, decision: e.target.value })}>
              <option value="">请选择</option>
              <option value="refund">判定退款</option>
              <option value="reject">驳回申请</option>
              <option value="partial">部分退款</option>
            </select>
            <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="备注" value={selected.remark} onChange={(e) => setSelected({ ...selected, remark: e.target.value })} />
            <div className="flex gap-2">
              <Button onClick={handleArbitrate}>提交仲裁</Button>
              <Button variant="outline" onClick={() => setSelected(null)}>取消</Button>
            </div>
          </div>
        </Card>
      )}

      {loading ? <div className="h-32 animate-pulse rounded-lg bg-gray-200" /> : items.length === 0 ? (
        <div className="py-20 text-center text-gray-400">暂无待仲裁售后</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="text-sm">
                  <p className="font-medium">用户 {item.user?.nickname} - {item.type === 'refund_only' ? '仅退款' : '退货退款'} ￥{item.amount}</p>
                  <p className="mt-1 text-xs text-gray-400">店铺：{item.shop?.name} | 订单：{item.order?.orderNo}</p>
                  <p className="text-xs text-gray-400">原因：{item.reason}</p>
                  <p className="mt-2 text-xs text-gray-500 font-medium">处理记录：</p>
                  {item.logs?.map((log: any) => (
                    <p key={log.id} className="text-xs text-gray-400">- {log.action}: {log.remark} ({new Date(log.createdAt).toLocaleString()})</p>
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
  );
}
