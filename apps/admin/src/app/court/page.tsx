'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, Badge } from '@zuoye/ui';
import { AdminLayout } from '@/components/admin-layout';

export default function AdminCourtPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    api.get('/admin/court/review').then((res) => { setItems(res.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, [router]);

  return (
    <AdminLayout title="小法庭复核">
      <div className="p-6">
        {loading ? (
          <div className="h-32 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-2)]" />
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-[var(--color-muted)]">暂无需复核的小法庭案件</div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Link key={item.id} href={`/court/${item.id}`}>
                <Card accent className="px-5 py-4 group">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-[var(--color-muted)]">{item.caseNo}</span>
                        <Badge variant="info">待复核</Badge>
                      </div>
                      <p className="mt-1.5 truncate text-sm font-medium">{item.productName || '售后案件'}</p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {item.shop?.name} · 售后金额 ¥{item.afterSale?.amount} · 支持买家 {item.afterSale ? item.buyerVotes || 0 : 0} / 支持商家 {item.afterSale ? item.shopVotes || 0 : 0}
                      </p>
                    </div>
                    <span className="text-[var(--color-muted)] group-hover:text-[var(--color-accent)] transition-colors">→</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
