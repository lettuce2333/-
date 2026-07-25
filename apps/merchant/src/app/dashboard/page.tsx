'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card } from '@zuoye/ui';
import { Package, ShoppingBag, MessageSquare, Settings, BarChart3, Store } from 'lucide-react';

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

  const nav = [
    { href: '/dashboard', label: '工作台', icon: BarChart3, active: true },
    { href: '/orders', label: '订单管理', icon: Package },
    { href: '/products', label: '商品管理', icon: ShoppingBag },
    { href: '/after-sales', label: '售后管理', icon: MessageSquare },
    { href: '/reviews', label: '评价管理', icon: MessageSquare },
    { href: '/shop', label: '店铺设置', icon: Settings },
    { href: '/stats', label: '数据统计', icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-gray-900 text-white flex-shrink-0">
        <div className="p-4">
          <Link href="/dashboard" className="text-lg font-bold text-red-400">商家后台</Link>
          {shop && <p className="mt-1 text-xs text-gray-400">{shop.name}</p>}
        </div>
        <nav className="mt-2 space-y-1 px-2">
          {nav.map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm ${item.active ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <item.icon className="h-4 w-4" />{item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 bg-gray-100">
        <header className="flex h-14 items-center justify-between bg-white px-6 shadow-sm">
          <h1 className="text-lg font-bold">工作台</h1>
          <button onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
            className="text-sm text-gray-500 hover:text-red-500">退出</button>
        </header>
        <div className="p-6">
          {!shop ? (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <Store className="mx-auto h-12 w-12 text-gray-300" />
              <h2 className="mt-4 text-lg font-bold">您还没有店铺</h2>
              <p className="mt-2 text-sm text-gray-500">联系管理员开通店铺或使用已有账号</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-6"><p className="text-sm text-gray-500">订单总数</p><p className="mt-2 text-2xl font-bold">{stats.orders}</p></Card>
                <Card className="p-6"><p className="text-sm text-gray-500">商品总数</p><p className="mt-2 text-2xl font-bold">{stats.products}</p></Card>
                <Card className="p-6"><p className="text-sm text-gray-500">售后待处理</p><p className="mt-2 text-2xl font-bold">{stats.afterSales}</p></Card>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <Link href="/orders?status=PAID"><Card className="p-4 text-sm hover:shadow-md transition-shadow">待发货订单 <span className="ml-2 text-red-500">&rarr;</span></Card></Link>
                <Link href="/after-sales?status=PENDING"><Card className="p-4 text-sm hover:shadow-md transition-shadow">待审核售后 <span className="ml-2 text-red-500">&rarr;</span></Card></Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
