'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, Badge } from '@zuoye/ui';
import { Gavel } from 'lucide-react';

const statusLabels: Record<string, string> = {
  JUDGING: '投票中',
  ADMIN_REVIEW: '管理员复核中',
};

export default function CourtLobbyPage() {
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.get('/court/lobby').then((res) => { setItems(res.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, [user, router]);

  const deadlineText = (iso: string) => {
    const left = new Date(iso).getTime() - Date.now();
    if (left <= 0) return '已截止';
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    return `${h}小时${m}分后截止`;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-ink)]">小法庭</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">公平投票，决定买卖双方谁有理</p>
        </div>
        <Badge variant="danger">投票可得法庭币</Badge>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-2)]" />
      ) : items.length === 0 ? (
        <div className="py-24 text-center">
          <Gavel className="mx-auto h-10 w-10 text-[var(--color-muted)] opacity-40" />
          <p className="mt-3 text-[var(--color-muted)]">暂无进行中的案件</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link key={item.id} href={`/court/${item.id}`}>
              <Card accent className="px-5 py-4 group">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[var(--color-muted)]">{item.caseNo}</span>
                      <Badge variant={item.status === 'ADMIN_REVIEW' ? 'info' : 'warning'}>{statusLabels[item.status] || item.status}</Badge>
                    </div>
                    <p className="mt-1.5 truncate text-sm font-medium text-[var(--color-ink)]">{item.productName || '售后案件'}</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {item.shop?.name} · 售后金额 ¥{item.afterSale?.amount} · {item.votes || 0}/9 票
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-danger)]">{deadlineText(item.voteDeadline)}</p>
                  </div>
                  <span className="text-[var(--color-muted)] group-hover:text-[var(--color-accent)] transition-colors">→</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
