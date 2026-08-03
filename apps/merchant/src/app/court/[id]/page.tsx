'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card, Badge } from '@zuoye/ui';
import { toast } from '@/components/toaster';
import { MerchantLayout } from '@/components/merchant-layout';

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

export default function MerchantCourtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [c, setC] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statement, setStatement] = useState('');
  const [rebuttal, setRebuttal] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api.get(`/court/${id}`).then((res) => { setC(res); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    load();
  }, [id, router]);

  const uploadImages = async () => {
    const token = localStorage.getItem('token');
    const urls: string[] = [];
    for (const file of images) {
      const fm = new FormData();
      fm.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fm });
      if (!res.ok) throw new Error('上传失败');
      const data = await res.json();
      urls.push(data.url);
    }
    return urls;
  };

  const submitEvidence = async (isRebuttal: boolean) => {
    if (!isRebuttal && !statement.trim()) { toast('请填写陈述', 'error'); return; }
    if (isRebuttal && !rebuttal.trim()) { toast('请填写反驳内容', 'error'); return; }
    setSubmitting(true);
    try {
      const urls = images.length ? await uploadImages() : undefined;
      await api.post(`/court/${id}/evidence`, isRebuttal ? { rebuttal: true, content: rebuttal } : { statement, images: urls });
      toast(isRebuttal ? '反驳已提交' : '证据已提交', 'success');
      setStatement(''); setRebuttal(''); setImages([]);
      load();
    } catch (err: any) { toast(err.message, 'error'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <MerchantLayout title="小法庭案件详情"><div className="p-6"><div className="h-48 animate-pulse rounded-lg bg-gray-200" /></div></MerchantLayout>;
  if (!c) return <MerchantLayout title="小法庭案件详情"><div className="p-6 text-[var(--color-muted)]">案件不存在</div></MerchantLayout>;

  const parseImages = (s: string) => { try { return JSON.parse(s || '[]'); } catch { return []; } };
  const canSubmit = c.status === 'JUDGING' || c.status === 'ADMIN_REVIEW';

  return (
    <MerchantLayout title="小法庭案件详情">
      <div className="p-6 max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">案件 {c.caseNo}</h1>
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">售后金额 ¥{c.afterSale?.amount} · 发起方：{c.initiator === 'buyer' ? '买家' : '商家'}</p>
          </div>
          <Badge variant={c.status === 'JUDGING' ? 'warning' : c.status === 'ADMIN_REVIEW' ? 'info' : 'success'}>{statusLabels[c.status] || c.status}</Badge>
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
          <div className="border-b border-gray-100 px-6 py-4 font-medium">投票结果 · 支持买家 {c.buyerVotes} / 支持商家 {c.shopVotes}</div>
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

        {canSubmit && (
          <Card className="mt-4">
            <div className="border-b border-gray-100 px-6 py-4 font-medium">提交商家证据 / 反驳</div>
            <div className="px-6 py-4 space-y-3">
              <textarea rows={3} placeholder="填写商家陈述" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" value={statement} onChange={(e) => setStatement(e.target.value)} />
              <input type="file" multiple accept="image/*" className="text-sm" onChange={(e) => setImages(Array.from(e.target.files || []).slice(0, 3))} />
              <div className="flex gap-2">
                <Button onClick={() => submitEvidence(false)} loading={submitting} disabled={!statement.trim() && images.length === 0}>提交陈述与证据</Button>
              </div>
              <textarea rows={2} placeholder="反驳买家（可选项）" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" value={rebuttal} onChange={(e) => setRebuttal(e.target.value)} />
              <Button variant="outline" onClick={() => submitEvidence(true)} loading={submitting} disabled={!rebuttal.trim()}>提交反驳</Button>
            </div>
          </Card>
        )}
      </div>
    </MerchantLayout>
  );
}
