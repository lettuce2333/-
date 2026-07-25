'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, Pagination } from '@zuoye/ui';

const getImages = (p: any) => {
  try { const arr = JSON.parse(p?.images || '[]'); return Array.isArray(arr) ? arr : []; } catch { return []; }
};

export default function ProductListPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  const categoryId = searchParams.get('categoryId');
  const keyword = searchParams.get('keyword');
  const sort = searchParams.get('sort') || '';

  const fetchProducts = (p: number) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categoryId) params.set('categoryId', categoryId);
    if (keyword) params.set('keyword', keyword);
    if (sort) params.set('sort', sort);
    if (priceRange.min) params.set('priceMin', priceRange.min);
    if (priceRange.max) params.set('priceMax', priceRange.max);
    params.set('page', String(p));
    params.set('pageSize', '12');
    api.get(\`/products?${params}\`).then((res: any) => {
      setProducts(res.data || []);
      setTotal(res.total || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(page); }, [page, categoryId, keyword, sort]);

  const pageCount = Math.ceil(total / 12);

  const buildSortLink = (s: string) => {
    const p = new URLSearchParams();
    if (categoryId) p.set('categoryId', categoryId);
    if (keyword) p.set('keyword', keyword);
    if (s) p.set('sort', s);
    return \`/products?${p}\`;
  };

  const handlePriceFilter = () => {
    setPage(1);
    fetchProducts(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">
          {keyword ? \`搜索: ${keyword}\` : categoryId ? '分类商品' : '全部商品'}
          <span className="ml-2 text-sm font-normal text-gray-400">共 {total} 件</span>
        </h1>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <Link href={buildSortLink('')} className={\`px-3 py-1 rounded ${!sort ? 'bg-red-500 text-white' : 'text-gray-600 hover:text-red-500'}\`}>默认</Link>
          <Link href={buildSortLink('sales')} className={\`px-3 py-1 rounded ${sort === 'sales' ? 'bg-red-500 text-white' : 'text-gray-600 hover:text-red-500'}\`}>销量</Link>
          <Link href={buildSortLink('price_asc')} className={\`px-3 py-1 rounded ${sort === 'price_asc' ? 'bg-red-500 text-white' : 'text-gray-600 hover:text-red-500'}\`}>价格↑</Link>
          <Link href={buildSortLink('price_desc')} className={\`px-3 py-1 rounded ${sort === 'price_desc' ? 'bg-red-500 text-white' : 'text-gray-600 hover:text-red-500'}\`}>价格↓</Link>
        </div>
      </div>

      {/* Price range filter */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        <span className="text-gray-500">价格筛选：</span>
        <input placeholder="最低价" type="number" className="w-24 rounded-lg border px-3 py-1.5" value={priceRange.min} onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })} />
        <span className="text-gray-400">—</span>
        <input placeholder="最高价" type="number" className="w-24 rounded-lg border px-3 py-1.5" value={priceRange.max} onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })} />
        <button onClick={handlePriceFilter} className="rounded-lg bg-red-500 px-4 py-1.5 text-white hover:bg-red-600">筛选</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <div key={i} className="h-72 animate-pulse rounded-lg bg-gray-200" />)}</div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center text-gray-400">暂无商品</div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {products.map((p: any) => (
            <Link key={p.id} href={\`/products/${p.id}\`}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
                <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                  {(() => { const imgs = getImages(p); return imgs.length > 0 ? <img src={imgs[0]} alt="" className="h-full w-full object-cover" /> : <span className="text-gray-300 text-4xl">📦</span>; })()}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-800 line-clamp-2">{p.name}</h3>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg font-bold text-red-500">¥{p.price}</span>
                    <span className="text-xs text-gray-400">已售{p.sales}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} pageCount={pageCount} total={total} onChange={setPage} />
    </div>
  );
}