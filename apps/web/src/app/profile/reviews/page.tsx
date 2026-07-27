'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card } from '@zuoye/ui';
import { Star } from 'lucide-react';

export default function ReviewsPage() {
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.get('/reviews').then((res) => {
      setReviews(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, router]);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-8"><div className="h-32 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-2)]" /></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold text-[var(--color-ink)]">我的评价</h1>
      {reviews.length === 0 ? (
        <div className="py-24 text-center text-[var(--color-muted)]">
          <Star className="mx-auto h-12 w-12 text-[var(--color-muted)]/40" />
          <p className="mt-3">暂无评价</p>
          <Link href="/orders" className="mt-2 inline-block text-sm text-[var(--color-accent)] hover:underline font-medium">去订单页评价</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r: any) => (
            <Card key={r.id} accent className="px-5 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link href={`/products/${r.productId}`} className="text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-accent)] transition-colors">
                    {r.product?.name}
                  </Link>
                  <div className="mt-1 flex items-center gap-1 text-amber-400">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`h-3.5 w-3.5 ${s <= r.rating ? 'fill-amber-400' : 'text-[var(--color-border)]'}`} />
                    ))}
                    <span className="ml-2 text-xs text-[var(--color-muted)]">{new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-ink)]">{r.content}</p>
                </div>
              </div>
              {r.replies?.length > 0 && (
                <div className="mt-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] p-3 text-sm text-[var(--color-muted)]">
                  <span className="font-medium text-[var(--color-ink)]">商家回复：</span>
                  {r.replies.map((rp: any) => (
                    <p key={rp.id} className="mt-1">{rp.content}</p>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
