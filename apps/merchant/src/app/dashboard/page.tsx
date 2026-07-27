'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card } from '@zuoye/ui';
import { Store } from 'lucide-react';
import { MerchantLayout } from '@/components/merchant-layout';

export default function MerchantDashboard() {
  const router = useRouter();
  const [shop, setShop] = useState<any>(null);
  const [stats, setStats] = useState({ orders: 0, products: 0, afterSales: 0 });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    api.get('/merchant/shop').then((res) => {
      setShop(res);
      if (res?.id) {
        api.get(`/merchant/orders?pageSize=1`).then((r: any) => setStats((s) => ({ ...s, orders: r.total || 0 })));
        api.get(`/merchant/products`).then((r: any) => setStats((s) => ({ ...s, products: r.total || 0 })));
        api.get(`/merchant/after-sales`).then((r: any) => setStats((s) => ({ ...s, afterSales: r.total || 0 })));
      }
    }).catch(() => router.push('/login'));
  }, [router]);

  return (
    <MerchantLayout title="工作台">
      <div className="p-6">
        {!shop ? (
          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border-light)] p-12 text-center shadow-[var(--shadow-card)]">
            <Store className="mx-auto h-12 w-12 text-[var(--color-muted)]/40" />
            <h2 className="mt-4 text-lg font-bold text-[var(--color-ink)]">您还没有店铺</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">联系管理员开通店铺或使用已有账号</p>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm text-[var(--color-muted)]">当前店铺</p>
                <p className="font-semibold text-[var(--color-ink)]">{shop?.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5"><p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">订单总数</p><p className="mt-2 text-2xl font-bold text-[var(--color-ink)]">{stats.orders}</p></Card>
              <Card accent className="p-5"><p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">商品总数</p><p className="mt-2 text-2xl font-bold text-[var(--color-ink)]">{stats.products}</p></Card>
              <Card className="p-5"><p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">售后待处理</p><p className="mt-2 text-2xl font-bold text-[var(--color-ink)]">{stats.afterSales}</p></Card>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/orders?status=PAID"><Card className="p-4 text-sm hover:shadow-[var(--shadow-md)] transition-shadow flex items-center justify-between">待发货订单 <span className="text-[var(--color-accent)]">&rarr;</span></Card></Link>
              <Link href="/after-sales?status=PENDING"><Card className="p-4 text-sm hover:shadow-[var(--shadow-md)] transition-shadow flex items-center justify-between">待审核售后 <span className="text-[var(--color-accent)]">&rarr;</span></Card></Link>
            </div>
          </>
        )}
      </div>
    </MerchantLayout>
  );
}
