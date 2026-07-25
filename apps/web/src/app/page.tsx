'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card } from '@zuoye/ui';

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
      <div className="bg-gradient-to-r from-red-500 to-orange-400 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-12">
          <div>
            <h1 className="text-4xl font-bold">品质生活 从这里开始</h1>
            <p className="mt-2 text-lg opacity-90">正品保障 · 极速物流 · 无忧售后</p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-3xl font-bold">￥5999</p>
            <p className="text-sm opacity-80">旗舰智能手机 Pro Max</p>
          </div>
        </div>
      </div>

      {/* Categories quick nav */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-4 gap-4">
          {['手机数码', '电脑办公', '家用电器', '服饰鞋包'].map((name, i) => (
            <Link key={name} href={`/products?categoryId=${i + 1}`}
              className="flex flex-col items-center rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <span className="text-lg font-medium text-gray-800">{name}</span>
              <span className="mt-1 text-sm text-gray-400">新品上线</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="mx-auto max-w-7xl px-4 pb-8">
        <h2 className="mb-4 text-xl font-bold text-gray-800">推荐商品</h2>
        {loading ? (
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {products.map((p: any) => (
              <Link key={p.id} href={`/products/${p.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center text-gray-300">
                    <span className="text-4xl">📦</span>
                  </div>
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
    </div>
  );
}
