'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card, Badge } from '@zuoye/ui';
import { MerchantLayout } from '@/components/merchant-layout';

const pl: Record<string, string> = { draft: '草稿', active: '在售', rejected: '驳回', archived: '归档' };
const pv: Record<string, string> = { draft: 'default', active: 'success', rejected: 'danger', archived: 'default' };

export default function MerchantProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    api.get('/merchant/products').then((res) => { setProducts(res.data || []); setLoading(false); });
  }, [router]);

  return (
    <MerchantLayout title="商品管理">
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/products/new"><Button size="sm">新增商品</Button></Link>
        </div>
        {loading ? <div className="h-48 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-2)]" /> : products.length === 0 ? (
          <div className="py-20 text-center text-[var(--color-muted)]">暂无商品</div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <Card key={p.id} accent className="flex items-center gap-4 px-5 py-4">
                <div className="h-16 w-16 flex-shrink-0 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)]/40 text-xl">📦</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-ink)]">{p.name}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">&yen;{p.price} | 库存: {p.totalStock} | 销量: {p.sales}</p>
                </div>
                <Badge variant={(pv[p.status] || 'default') as any}>{pl[p.status] || p.status}</Badge>
                <Link href={`/products/${p.id}/edit`}><Button variant="outline" size="sm">编辑</Button></Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MerchantLayout>
  );
}
