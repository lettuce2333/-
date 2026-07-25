'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card, Badge } from '@zuoye/ui';

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
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">商品管理</h1>
        <Link href="/products/new"><Button size="sm">新增商品</Button></Link>
      </div>
      {loading ? <div className="h-48 animate-pulse rounded-lg bg-gray-200" /> : products.length === 0 ? (
        <div className="py-20 text-center text-gray-400">暂无商品</div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <Card key={p.id} className="flex items-center gap-4 px-6 py-4">
              <div className="h-16 w-16 flex-shrink-0 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xl">📦</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{p.name}</p>
                <p className="mt-1 text-xs text-gray-400">￥{p.price} | 库存: {p.totalStock} | 销量: {p.sales}</p>
              </div>
              <Badge variant={(pv[p.status] || 'default') as any}>{pl[p.status] || p.status}</Badge>
              <Link href={`/products/${p.id}/edit`}><Button variant="outline" size="sm">编辑</Button></Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
