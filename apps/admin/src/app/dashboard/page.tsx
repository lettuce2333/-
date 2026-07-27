'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card } from '@zuoye/ui';
import { AdminLayout } from '@/components/admin-layout';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ userCount: 0, shopCount: 0, productCount: 0, orderCount: 0, revenue: 0 });

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    api.get('/admin/stats').then(setStats).catch(() => router.push('/login'));
  }, [router]);

  return (
    <AdminLayout title="仪表盘">
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="p-5">
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">用户数</p>
            <p className="mt-2 text-2xl font-bold text-[var(--color-ink)]">{stats.userCount}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">店铺数</p>
            <p className="mt-2 text-2xl font-bold text-[var(--color-ink)]">{stats.shopCount}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">商品数</p>
            <p className="mt-2 text-2xl font-bold text-[var(--color-ink)]">{stats.productCount}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">订单数</p>
            <p className="mt-2 text-2xl font-bold text-[var(--color-ink)]">{stats.orderCount}</p>
          </Card>
          <Card accent className="p-5">
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">营业额</p>
            <p className="mt-2 text-2xl font-bold text-[var(--color-accent)]">&yen;{stats.revenue}</p>
          </Card>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/users"><Card className="p-4 text-sm hover:shadow-[var(--shadow-md)] transition-shadow flex items-center justify-between">用户管理 <span className="text-[var(--color-accent)]">&rarr;</span></Card></Link>
          <Link href="/shops"><Card className="p-4 text-sm hover:shadow-[var(--shadow-md)] transition-shadow flex items-center justify-between">店铺管理 <span className="text-[var(--color-accent)]">&rarr;</span></Card></Link>
          <Link href="/products"><Card className="p-4 text-sm hover:shadow-[var(--shadow-md)] transition-shadow flex items-center justify-between">商品审核 <span className="text-[var(--color-accent)]">&rarr;</span></Card></Link>
          <Link href="/after-sales"><Card className="p-4 text-sm hover:shadow-[var(--shadow-md)] transition-shadow flex items-center justify-between">售后仲裁 <span className="text-[var(--color-accent)]">&rarr;</span></Card></Link>
        </div>
      </div>
    </AdminLayout>
  );
}
