'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card, Badge } from '@zuoye/ui';
import { toast } from '@/components/toaster';
import { AdminLayout } from '@/components/admin-layout';

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    api.get('/admin/products').then((res) => { setProducts(res.data || []); setLoading(false); });
  }, [router]);

  const review = async (id: number, action: string) => {
    try { await api.post(`/admin/products/${id}/review`, { action }); toast(action === 'approve' ? '已通过' : '已驳回', 'success'); window.location.reload(); } catch (err: any) { toast(err.message, 'error'); }
  };

  return (
    <AdminLayout title="商品审核">
      <div className="p-6">
        {loading ? <div className="h-32 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-2)]" /> : products.length === 0 ? (
          <div className="py-20 text-center text-[var(--color-muted)]">暂无待审核商品</div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <Card key={p.id} accent className="flex items-center justify-between px-5 py-4">
                <div className="text-sm">
                  <p className="font-medium text-[var(--color-ink)]">{p.name}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">店铺：{p.shop?.name} | 类目：{p.category?.name} | &yen;{p.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={p.status === 'active' ? 'success' : 'default'}>{p.status}</Badge>
                  {p.status === 'draft' && <><Button size="sm" onClick={() => review(p.id, 'approve')}>通过</Button><Button size="sm" variant="outline" onClick={() => review(p.id, 'reject')}>驳回</Button></>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
