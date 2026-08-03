'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card, Badge } from '@zuoye/ui';
import { toast } from '@/components/toaster';
import { AdminLayout } from '@/components/admin-layout';

const statusLabels: Record<string, string> = {
  JUDGING: '投票中',
  ADMIN_REVIEW: '管理员复核中',
  CLOSED_BUYER_WIN: '买家胜诉',
  CLOSED_SHOP_WIN: '商家胜诉',
  ADMIN_REFUND: '管理员判定退款',
  ADMIN_REJECT: '管理员判定驳回',
  ADMIN_PARTIAL: '管理员判定部分退款',
  CANCELLED: '已撤销',
};

export default function AdminCourtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [c, setC] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [remark, setRemark] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.get(`/court/${id}`).then((res) => { setC(res); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    load();
  }, [id, router]);

  const decide = async (decision: string) => {
    setBusy(true);
    try {
      await api.post(`/admin/court/${id}/decision`, { decision, remark });
      toast('复核完成', 'success');
      load();
    } catch (err: any) { toast(err.message, 'error'); }
    finally { setBusy(false); }
  };

  if (loading) return <AdminLayout title="小法庭复核详情"><div className="p-6"><div className="h-48 animate-pulse rounded-lg bg-gray-200" /></div></AdminLayout>;
  if (!c) return <AdminLayout title="小法庭复核详情"><div className="p-6 text-[var(--color-muted)]">案件不存在</div></AdminLayout>;

  const parseImages = (s: string) => { try { return JSON.parse(s || '[]'); } catch { return []; } };

  return (
    <AdminLayout title="小法庭复核详情">
      <div className="p-6 max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">案件 {c.caseNo}</h1>
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">售后金额 ¥{c.afterSale?.amount} · 买家 {c.buyer?.nickname || c.buyer?.email} · {c.shop?.name}</p>
          </div>
          <Badge variant={c.status === 'ADMIN_REVIEW' ? 'info' : 'success'}>{statusLabels[c.status] || c.status}</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <div className="border-b border-gray-100 px-5 py-3 font-medium">买家陈述</div>
            <div className="px-5 py-4 text-sm space-y-2">
              <p>{c.buyerStatement || '暂未提交'}</p>
              <div className="flex flex-wrap gap-2">
                {parseImages(c.buyerEvidence).map((u: string, i: number) => <img key={i} src={u} alt="" className="h-20 w-20 rounded object-cover" />)}
              </div>
              {c.buyerRebuttal && <p className="rounded bg-gray-50 p-2 text-gray-600">反驳：{c.buyerRebuttal}</p>}
            </div>
          </Card>
          <Card>
            <div className="border-b border-gray-100 px-5 py-3 font-medium">商家陈述</div>
            <div className="px-5 py-4 text-sm space-y-2">
              <p>{c.shopStatement || '暂未提交'}</p>
              <div className="flex flex-wrap gap-2">
                {parseImages(c.shopEvidence).map((u: string, i: number) => <img key={i} src={u} alt="" className="h-20 w-20 rounded object-cover" />)}
              </div>
              {c.shopRebuttal && <p className="rounded bg-gray-50 p-2 text-gray-600">反驳：{c.shopRebuttal}</p>}
            </div>
          </Card>
        </div>

        <Card className="mt-4">
          <div className="border-b border-gray-100 px-6 py-4 font-medium">陪审投票 · 支持买家 {c.buyerVotes} / 支持商家 {c.shopVotes}</div>
          <div className="px-6 py-4">
            {c.votes?.length === 0 ? <p className="text-sm text-gray-400">暂无投票</p> : (
              <div className="space-y-2">
                {c.votes.map((v: any) => (
                  <div key={v.id} className="flex items-center gap-3 rounded bg-gray-50 px-3 py-2 text-sm">
                    <span className="font-medium">{v.user?.nickname || '匿名用户'}</span>
                    <Badge variant={v.side === 'buyer' ? 'success' : 'danger'}>{v.side === 'buyer' ? '支持买家' : '支持商家'}</Badge>
                    {v.comment && <span className="text-gray-500 line-clamp-1">{v.comment}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {c.status === 'ADMIN_REVIEW' && (
          <Card className="mt-4">
            <div className="border-b border-gray-100 px-6 py-4 font-medium">作出复核决定</div>
            <div className="px-6 py-4 space-y-3">
              <textarea rows={2} placeholder="复核备注（可选）" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" value={remark} onChange={(e) => setRemark(e.target.value)} />
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => decide('refund')} loading={busy}>判定退款</Button>
                <Button variant="danger" onClick={() => decide('reject')} loading={busy}>判定驳回</Button>
                <Button variant="outline" onClick={() => decide('partial')} loading={busy}>部分退款</Button>
              </div>
            </div>
          </Card>
        )}

        {c.adminDecision && (
          <Card className="mt-4">
            <div className="border-b border-gray-100 px-6 py-4 font-medium">复核结果</div>
            <div className="px-6 py-4 text-sm">
              <p>决定：{c.adminDecision}</p>
              {c.adminRemark && <p className="mt-1 text-gray-500">{c.adminRemark}</p>}
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
