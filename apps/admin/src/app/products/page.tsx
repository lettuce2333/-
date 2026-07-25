'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card, Badge } from '@zuoye/ui';
import { toast } from '@/components/toaster';

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
    <div className="p-6">
      <h1 className="mb-4 text-lg font-bold">商品审核</h1>
      {loading ? <div className="h-32 animate-pulse rounded-lg bg-gray-200" /> : products.length === 0 ? (
        <div className="py-20 text-center text-gray-400">暂无待审核商品</div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <Card key={p.id} className="flex items-center justify-between px-6 py-4">
              <div className="text-sm">
                <p className="font-medium">{p.name}</p>
                <p className="mt-1 text-xs text-gray-400">店铺：{p.shop?.name} | 类目：{p.category?.name} | ￥{p.price}</p>
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
  );
}
