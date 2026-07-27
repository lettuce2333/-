'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card } from '@zuoye/ui';

const getImages = (p: any) => {
  try { const arr = JSON.parse(p?.images || "[]"); return Array.isArray(arr) ? arr : []; } catch { return []; }
};

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products?pageSize=12').then((res) => {
      setProducts(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[var(--color-accent)] via-[var(--color-accent-hover)] to-[#7f1d1d] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-14">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">品质生活 从这里开始</h1>
            <p className="mt-3 text-lg opacity-80 max-w-md leading-relaxed">正品保障 · 极速物流 · 无忧售后</p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-sm opacity-60 uppercase tracking-widest text-xs">热销推荐</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">&yen;5999</p>
            <p className="mt-1 text-sm opacity-70">旗舰智能手机 Pro Max</p>
          </div>
        </div>
      </div>

      {/* Categories quick nav */}
      <div className="mx-auto max-w-7xl px-4 -mt-7 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {['手机数码', '电脑办公', '家用电器', '服饰鞋包'].map((name, i) => (
            <Link key={name} href={`/products?categoryId=${i + 1}`}
              className="flex flex-col items-center rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-md)] transition-all duration-250 hover:-translate-y-0.5 active:scale-[0.98]">
              <span className="text-base font-semibold text-[var(--color-ink)]">{name}</span>
              <span className="mt-1.5 text-xs text-[var(--color-muted)]">新品上线</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-8">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-lg font-bold text-[var(--color-ink)]">推荐商品</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-[var(--color-border)] to-transparent" />
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-[340px] animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-2)]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p: any) => (
              <Link key={p.id} href={`/products/${p.id}`}>
                <Card accent className="overflow-hidden group h-full">
                  <div className="aspect-square bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)]/40 overflow-hidden">
                    {(() => { const imgs = getImages(p); return imgs.length > 0
                      ? <img src={imgs[0]} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <span className="text-4xl">📦</span>; })()}
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
      </div>
    </div>
  );
}
