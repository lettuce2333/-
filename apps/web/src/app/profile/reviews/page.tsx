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

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-8"><div className="h-32 animate-pulse rounded-lg bg-gray-200" /></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold">我的评价</h1>
      {reviews.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <Star className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2">暂无评价</p>
          <Link href="/orders" className="mt-2 inline-block text-sm text-red-500 hover:underline">去订单页评价</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r: any) => (
            <Card key={r.id} className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link href={\/products/\} className="text-sm font-medium text-gray-800 hover:text-red-500">
                    {r.product?.name}
                  </Link>
                  <div className="mt-1 flex items-center gap-1 text-yellow-400">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={\h-3.5 w-3.5 \} />
                    ))}
                    <span className="ml-2 text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{r.content}</p>
                </div>
              </div>
              {r.replies?.length > 0 && (
                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-500">
                  <span className="font-medium text-gray-700">商家回复：</span>
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