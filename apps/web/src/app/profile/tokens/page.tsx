'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, Button } from '@zuoye/ui';
import { Coins } from 'lucide-react';

const typeLabels: Record<string, string> = {
  court_reward: '小法庭判案奖励',
  redeem_coupon: '兑换优惠券',
  redeem_product: '兑换商品',
};

export default function TokenWalletPage() {
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.get('/tokens/me').then((res) => { setMe(res); setLoading(false); }).catch(() => setLoading(false));
  }, [user, router]);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-8"><div className="h-48 animate-pulse rounded-lg bg-gray-200" /></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">法庭币钱包</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">参与小法庭判案获得奖励，可兑换优惠券和商品</p>
        </div>
        <Link href="/profile/tokens/redeem"><Button>兑换中心</Button></Link>
      </div>

      <Card className="mb-6 overflow-hidden" accent>
        <div className="flex items-center gap-4 bg-gradient-to-r from-[var(--color-accent)]/5 to-transparent px-6 py-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
            <Coins className="h-7 w-7" />
          </div>
          <div>
            <p className="text-3xl font-bold">{me?.balance || 0}</p>
            <p className="text-sm text-[var(--color-muted)]">可用法庭币 · 累计获得 {me?.totalEarned || 0}</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="border-b border-gray-100 px-6 py-4 font-medium">最近流水</div>
        <div className="px-6 py-4">
          {me?.transactions?.length === 0 ? (
            <p className="text-sm text-gray-400">暂无流水</p>
          ) : (
            <div className="space-y-2">
              {me?.transactions?.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between rounded bg-gray-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{typeLabels[t.type] || t.type}</p>
                    <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={t.amount > 0 ? 'font-bold text-green-600' : 'font-bold text-red-500'}>
                    {t.amount > 0 ? '+' : ''}{t.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
