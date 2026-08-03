'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, Badge } from '@zuoye/ui';

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

export default function MyCourtPage() {
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.get('/court/my').then((res) => { setItems(res || []); setLoading(false); }).catch(() => setLoading(false));
  }, [user, router]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold">我的小法庭</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">参与过的案件和裁决记录</p>
      </div>
      {loading ? (
        <div className="h-32 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-2)]" />
      ) : items.length === 0 ? (
        <div className="py-24 text-center text-[var(--color-muted)]">暂无案件记录</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link key={item.id} href={`/court/${item.id}`}>
              <Card accent className="px-5 py-4 group">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[var(--color-muted)]">{item.caseNo}</span>
                      <Badge variant={item.status === 'JUDGING' ? 'warning' : item.status === 'ADMIN_REVIEW' ? 'info' : 'success'}>
                        {statusLabels[item.status] || item.status}
                      </Badge>
                    </div>
                    <p className="mt-1.5 truncate text-sm font-medium">{item.productName || '售后案件'}</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">{item.shop?.name} · ¥{item.afterSale?.amount} · {item.votes || 0}/9 票</p>
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
