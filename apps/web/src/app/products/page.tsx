'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, Pagination } from '@zuoye/ui';

const getImages = (p: any) => {
  try { const arr = JSON.parse(p?.images || '[]'); return Array.isArray(arr) ? arr : []; } catch { return []; }
};

export default function ProductListPage() {
  return <Suspense fallback={null}><ProductListContent /></Suspense>;
}

function ProductListContent() {
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
    api.get(`/products?${params}`).then((res: any) => {
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
    return `/products?${p}`;
  };

  const handlePriceFilter = () => {
    setPage(1);
    fetchProducts(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-ink)]">
            {keyword ? `"${keyword}" 的搜索结果` : categoryId ? '分类商品' : '全部商品'}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">共 {total} 件商品</p>
        </div>
        <div className="flex items-center gap-1.5 text-sm bg-[var(--color-surface)] rounded-[var(--radius-sm)] border border-[var(--color-border-light)] p-0.5">
          {[
            { key: '', label: '默认' },
            { key: 'sales', label: '销量' },
            { key: 'price_asc', label: '价格 ↑' },
            { key: 'price_desc', label: '价格 ↓' },
          ].map((s) => (
            <Link key={s.key} href={buildSortLink(s.key)}
              className={`px-3 py-1.5 rounded-[var(--radius-sm)] transition-all duration-150 ${sort === s.key ? 'bg-[var(--color-accent)] text-white shadow-sm' : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'}`}>
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Price range filter */}
      <div className="mb-6 flex items-center gap-2 text-sm flex-wrap">
        <span className="text-[var(--color-muted)]">价格筛选</span>
        <input placeholder="最低价" type="number" className="w-24 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-1.5 text-sm bg-[var(--color-surface)] placeholder:text-[var(--color-muted)]" value={priceRange.min} onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })} />
        <span className="text-[var(--color-muted)]">—</span>
        <input placeholder="最高价" type="number" className="w-24 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-1.5 text-sm bg-[var(--color-surface)] placeholder:text-[var(--color-muted)]" value={priceRange.max} onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })} />
        <button onClick={handlePriceFilter} className="rounded-[var(--radius-sm)] border border-[var(--color-accent)] px-4 py-1.5 text-sm text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-all duration-150 active:scale-[0.97]">筛选</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-[340px] animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-2)]" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-4xl mb-3 opacity-40">📦</p>
          <p className="text-[var(--color-muted)]">暂无商品</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p: any) => (
            <Link key={p.id} href={`/products/${p.id}`}>
              <Card accent className="overflow-hidden group h-full">
                <div className="aspect-square bg-[var(--color-surface-2)] flex items-center justify-center overflow-hidden">
                  {(() => { const imgs = getImages(p); return imgs.length > 0
                    ? <img src={imgs[0]} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <span className="text-4xl text-[var(--color-muted)]/40">📦</span>; })()}
                </div>
                <div className="p-3.5">
                  <h3 className="text-sm font-medium text-[var(--color-ink)] line-clamp-2 leading-snug">{p.name}</h3>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-base font-bold text-[var(--color-accent)]">&yen;{p.price}</span>
                    <span className="text-xs text-[var(--color-muted)]">已售 {p.sales}</span>
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
