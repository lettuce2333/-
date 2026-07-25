'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card } from '@zuoye/ui';
import { Users, Store, Package, ShoppingBag, MessageSquare, Settings, BarChart3, Layers } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ userCount: 0, shopCount: 0, productCount: 0, orderCount: 0, revenue: 0 });

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    api.get('/admin/stats').then(setStats).catch(() => router.push('/login'));
  }, [router]);

  const nav = [
    { href: '/dashboard', label: '仪表盘', icon: BarChart3 },
    { href: '/users', label: '用户管理', icon: Users },
    { href: '/shops', label: '店铺管理', icon: Store },
    { href: '/products', label: '商品审核', icon: ShoppingBag },
    { href: '/categories', label: '类目管理', icon: Layers },
    { href: '/orders', label: '订单监管', icon: Package },
    { href: '/after-sales', label: '售后仲裁', icon: MessageSquare },
    { href: '/roles', label: '权限管理', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-gray-900 text-white flex-shrink-0">
        <div className="p-4"><span className="text-lg font-bold text-red-400">管理后台</span></div>
        <nav className="mt-2 space-y-1 px-2">
          {nav.map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-800 hover:text-white">
              <item.icon className="h-4 w-4" />{item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 bg-gray-100">
        <header className="flex h-14 items-center justify-between bg-white px-6 shadow-sm">
          <h1 className="text-lg font-bold">仪表盘</h1>
          <button onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
            className="text-sm text-gray-500 hover:text-red-500">退出</button>
        </header>
        <div className="p-6">
          <div className="grid grid-cols-5 gap-4">
            <Card className="p-6"><p className="text-sm text-gray-500">用户数</p><p className="mt-2 text-2xl font-bold">{stats.userCount}</p></Card>
            <Card className="p-6"><p className="text-sm text-gray-500">店铺数</p><p className="mt-2 text-2xl font-bold">{stats.shopCount}</p></Card>
            <Card className="p-6"><p className="text-sm text-gray-500">商品数</p><p className="mt-2 text-2xl font-bold">{stats.productCount}</p></Card>
            <Card className="p-6"><p className="text-sm text-gray-500">订单数</p><p className="mt-2 text-2xl font-bold">{stats.orderCount}</p></Card>
            <Card className="p-6"><p className="text-sm text-gray-500">营业额</p><p className="mt-2 text-2xl font-bold text-red-500">￥{stats.revenue}</p></Card>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Link href="/users"><Card className="p-4 text-sm hover:shadow-md">用户管理 <span className="ml-2 text-red-500">&rarr;</span></Card></Link>
            <Link href="/shops"><Card className="p-4 text-sm hover:shadow-md">店铺管理 <span className="ml-2 text-red-500">&rarr;</span></Card></Link>
            <Link href="/products"><Card className="p-4 text-sm hover:shadow-md">商品审核 <span className="ml-2 text-red-500">&rarr;</span></Card></Link>
            <Link href="/after-sales"><Card className="p-4 text-sm hover:shadow-md">售后仲裁 <span className="ml-2 text-red-500">&rarr;</span></Card></Link>
          </div>
        </div>
      </main>
    </div>
  );
}
