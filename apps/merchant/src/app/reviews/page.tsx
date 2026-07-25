'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card, Badge } from '@zuoye/ui';
import { toast } from '@/components/toaster';
import { Star, MessageSquare } from 'lucide-react';

export default function MerchantReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [replying, setReplying] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    api.get('/merchant/reviews').then((res) => {
      setReviews(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [router]);

  const handleReply = async (reviewId: number) => {
    const content = replyText[reviewId];
    if (!content?.trim()) { toast('请输入回复内容', 'error'); return; }
    setReplying({ ...replying, [reviewId]: true });
    try {
      await api.post(\`/merchant/reviews/${reviewId}/reply\`, { content });
      toast('回复成功', 'success');
      setReplyText({ ...replyText, [reviewId]: '' });
      const res = await api.get('/merchant/reviews');
      setReviews(res.data || []);
    } catch (err: any) { toast(err.message, 'error'); } finally { setReplying({ ...replying, [reviewId]: false }); }
  };

  if (loading) return <div className="p-6"><div className="h-32 animate-pulse rounded-lg bg-gray-200" /></div>;

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="mb-6 text-lg font-bold">评价管理</h1>
      {reviews.length === 0 ? (
        <div className="py-20 text-center text-gray-400"><MessageSquare className="mx-auto h-12 w-12 text-gray-300" /><p className="mt-2">暂无评价</p></div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id} className="px-6 py-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{r.user?.nickname || '匿名用户'}</span>
                    <span className="text-xs text-gray-400">{r.product?.name}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-yellow-400">
                    {[1,2,3,4,5].map((s) => (<Star key={s} className={\`h-3.5 w-3.5 ${s <= r.rating ? 'fill-yellow-400' : 'text-gray-200'}\`} />))}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{r.content}</p>
                  <p className="mt-1 text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {r.replies?.length > 0 ? (
                <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-gray-600">
                  <span className="font-medium text-blue-600">已回复：</span>
                  {r.replies.map((rp: any) => (<p key={rp.id} className="mt-1">{rp.content}</p>))}
                </div>
              ) : (
                <div className="mt-3">
                  <textarea placeholder="回复此评价..." className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} value={replyText[r.id] || ''} onChange={(e) => setReplyText({ ...replyText, [r.id]: e.target.value })} />
                  <div className="mt-1 flex justify-end">
                    <Button size="sm" onClick={() => handleReply(r.id)} loading={replying[r.id]}>回复</Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}