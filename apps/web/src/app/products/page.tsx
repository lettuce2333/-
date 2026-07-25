'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card } from '@zuoye/ui';

export default function ProductListPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const categoryId = searchParams.get('categoryId');
  const keyword = searchParams.get('keyword');
  const sort = searchParams.get('sort') || '';

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categoryId) params.set('categoryId', categoryId);
    if (keyword) params.set('keyword', keyword);
    if (sort) params.set('sort', sort);
    params.set('pageSize', '20');
    api.get(`/products?${params}`).then((res) => {
      setProducts(res.data || []);
      setTotal(res.total || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [categoryId, keyword, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          {keyword ? `搜索: ${keyword}` : categoryId ? '分类商品' : '全部商品'}
          <span className="ml-2 text-sm font-normal text-gray-400">共 {total} 件</span>
        </h1>
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/products?${new URLSearchParams({ ...(categoryId ? { categoryId } : {}), ...(keyword ? { keyword } : {}) }).toString()}`}
            className={`px-3 py-1 rounded ${!sort ? 'bg-red-500 text-white' : 'text-gray-600 hover:text-red-500'}`}>默认</Link>
          <Link href={`/products?sort=sales&${new URLSearchParams({ ...(categoryId ? { categoryId } : {}), ...(keyword ? { keyword } : {}) }).toString()}`}
            className={`px-3 py-1 rounded ${sort === 'sales' ? 'bg-red-500 text-white' : 'text-gray-600 hover:text-red-500'}`}>销量</Link>
          <Link href={`/products?sort=price_asc&${new URLSearchParams({ ...(categoryId ? { categoryId } : {}), ...(keyword ? { keyword } : {}) }).toString()}`}
            className={`px-3 py-1 rounded ${sort === 'price_asc' ? 'bg-red-500 text-white' : 'text-gray-600 hover:text-red-500'}`}>价格↑</Link>
          <Link href={`/products?sort=price_desc&${new URLSearchParams({ ...(categoryId ? { categoryId } : {}), ...(keyword ? { keyword } : {}) }).toString()}`}
            className={`px-3 py-1 rounded ${sort === 'price_desc' ? 'bg-red-500 text-white' : 'text-gray-600 hover:text-red-500'}`}>价格↓</Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-72 animate-pulse rounded-lg bg-gray-200" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center text-gray-400">暂无商品</div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {products.map((p: any) => (
            <Link key={p.id} href={`/products/${p.id}`}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
                <div className="aspect-square bg-gray-100 flex items-center justify-center text-gray-300 text-4xl">📦</div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-800 line-clamp-2">{p.name}</h3>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg font-bold text-red-500">￥{p.price}</span>
                    <span className="text-xs text-gray-400">已售{p.sales}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
