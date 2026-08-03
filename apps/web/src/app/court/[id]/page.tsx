'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, Badge } from '@zuoye/ui';
import { toast } from '@/components/toaster';

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

export default function CourtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const [c, setC] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [side, setSide] = useState('buyer');
  const [comment, setComment] = useState('');
  const [statement, setStatement] = useState('');
  const [rebuttal, setRebuttal] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api.get(`/court/${id}`).then((res) => { setC(res); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    load();
  }, [id, user, router]);

  const submitVote = async () => {
    setSubmitting(true);
    try {
      await api.post(`/court/${id}/vote`, { side, comment });
      toast('投票成功', 'success');
      load();
    } catch (err: any) { toast(err.message, 'error'); }
    finally { setSubmitting(false); }
  };

  const uploadImages = async () => {
    const urls: string[] = [];
    for (const file of images) {
      const res = await api.upload(file);
      urls.push(res.url);
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

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-8"><div className="h-48 animate-pulse rounded-lg bg-gray-200" /></div>;
  if (!c) return <div className="py-20 text-center text-gray-400">案件不存在</div>;

  const isBuyerParty = user?.id === c.afterSale?.userId;
  const canSubmitEvidence = isBuyerParty && (c.status === 'JUDGING' || c.status === 'ADMIN_REVIEW');
  const parseImages = (s: string) => { try { return JSON.parse(s || '[]'); } catch { return []; } };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">小法庭案件</h1>
          <p className="mt-0.5 font-mono text-xs text-[var(--color-muted)]">{c.caseNo}</p>
        </div>
        <Badge variant={c.status === 'CLOSED_BUYER_WIN' || c.status === 'ADMIN_REFUND' ? 'success' : c.status === 'JUDGING' ? 'warning' : 'danger'}>
          {statusLabels[c.status] || c.status}
        </Badge>
      </div>

      <Card className="mb-4">
        <div className="border-b border-gray-100 px-6 py-4 font-medium">案件信息</div>
        <div className="px-6 py-4 text-sm space-y-2">
          <p>买家：{c.buyer?.nickname || c.buyer?.email}</p>
          <p>店铺：{c.shop?.name}</p>
          <p>售后类型：{c.afterSale?.type === 'refund_only' ? '仅退款' : '退货退款'} · 金额 ¥{c.afterSale?.amount}</p>
          <p>售后原因：{c.afterSale?.reason}</p>
          <p>发起方：{c.initiator === 'buyer' ? '买家' : '商家'}</p>
          <p>截止时间：{new Date(c.voteDeadline).toLocaleString()}</p>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="border-b border-gray-100 px-5 py-3 font-medium">买家陈述</div>
          <div className="px-5 py-4 text-sm space-y-2">
            <p className="text-gray-700">{c.buyerStatement || '暂未提交'}</p>
            <div className="flex flex-wrap gap-2">
              {parseImages(c.buyerEvidence).map((u: string, i: number) => (
                <img key={i} src={u} alt="buyer-evidence" className="h-20 w-20 rounded object-cover" />
              ))}
            </div>
            {c.buyerRebuttal && <p className="rounded bg-gray-50 p-2 text-gray-600">反驳：{c.buyerRebuttal}</p>}
          </div>
        </Card>
        <Card>
          <div className="border-b border-gray-100 px-5 py-3 font-medium">商家陈述</div>
          <div className="px-5 py-4 text-sm space-y-2">
            <p className="text-gray-700">{c.shopStatement || '暂未提交'}</p>
            <div className="flex flex-wrap gap-2">
              {parseImages(c.shopEvidence).map((u: string, i: number) => (
                <img key={i} src={u} alt="shop-evidence" className="h-20 w-20 rounded object-cover" />
              ))}
            </div>
            {c.shopRebuttal && <p className="rounded bg-gray-50 p-2 text-gray-600">反驳：{c.shopRebuttal}</p>}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <div className="border-b border-gray-100 px-6 py-4 font-medium">投票结果 · 支持买家 {c.buyerVotes} / 支持商家 {c.shopVotes}</div>
        <div className="px-6 py-4">
          {c.votes?.length === 0 ? (
            <p className="text-sm text-gray-400">暂无陪审员投票</p>
          ) : (
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

      {c.status === 'JUDGING' && !c.myVote && c.canVote && (
        <Card className="mt-4">
          <div className="border-b border-gray-100 px-6 py-4 font-medium">投出你的一票</div>
          <div className="px-6 py-4 space-y-3">
            <div className="flex gap-2">
              <button onClick={() => setSide('buyer')} className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${side === 'buyer' ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-200 text-gray-500'}`}>支持买家</button>
              <button onClick={() => setSide('shop')} className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${side === 'shop' ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200 text-gray-500'}`}>支持商家</button>
            </div>
            <textarea rows={3} placeholder="写下你的判断理由（公开可见）" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" value={comment} onChange={(e) => setComment(e.target.value)} />
            <Button onClick={submitVote} loading={submitting}>提交投票</Button>
          </div>
        </Card>
      )}

      {c.status === 'JUDGING' && !c.myVote && !c.canVote && (
        <Card className="mt-4">
          <div className="px-6 py-4 text-sm text-[var(--color-muted)]">{c.voteReason || '当前账号没有投票资格'}</div>
        </Card>
      )}

      {canSubmitEvidence && (
        <Card className="mt-4">
          <div className="border-b border-gray-100 px-6 py-4 font-medium">提交证据 / 反驳</div>
          <div className="px-6 py-4 space-y-3">
            <textarea rows={3} placeholder="填写你的陈述" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" value={statement} onChange={(e) => setStatement(e.target.value)} />
            <input type="file" multiple accept="image/*" className="text-sm" onChange={(e) => setImages(Array.from(e.target.files || []).slice(0, 3))} />
            <div className="flex gap-2">
              <Button onClick={() => submitEvidence(false)} loading={submitting} disabled={images.length === 0 && !statement.trim()}>提交陈述与证据</Button>
            </div>
            <textarea rows={2} placeholder="反驳对方（可选项）" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" value={rebuttal} onChange={(e) => setRebuttal(e.target.value)} />
            <Button variant="outline" onClick={() => submitEvidence(true)} loading={submitting} disabled={!rebuttal.trim()}>提交反驳</Button>
          </div>
        </Card>
      )}

      {c.adminDecision && (
        <Card className="mt-4">
          <div className="border-b border-gray-100 px-6 py-4 font-medium">管理员复核结论</div>
          <div className="px-6 py-4 text-sm">
            <p>决定：{c.adminDecision}</p>
            {c.adminRemark && <p className="mt-1 text-gray-500">{c.adminRemark}</p>}
          </div>
        </Card>
      )}
    </div>
  );
}
