'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Search, ShoppingCart, User, LogOut, Package, Bell } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [keyword, setKeyword] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) router.push(`/products?keyword=${encodeURIComponent(keyword.trim())}`);
  };

  return (
    <header className="bg-white border-b">
      {/* Top bar */}
      <div className="bg-gray-100 text-xs text-gray-500">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4">
          <span>优品商城 - 品质生活从这里开始</span>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/profile" className="hover:text-red-500">Hi, {user.nickname || user.email}</Link>
                {user.roles?.some((r: any) => r.role === 'shop_owner' || r.role === 'shop_cs') && (
                  <a href={"http://localhost:3001/login?token=".concat(encodeURIComponent(localStorage.getItem("token") || ""))} className="hover:text-green-500 text-xs">商家后台</a>
                )}
                {user.roles?.some((r: any) => r.role === 'super_admin' || r.role === 'business_admin' || r.role === 'cs_admin') && (
                  <a href={"http://localhost:3002/login?token=".concat(encodeURIComponent(localStorage.getItem("token") || ""))} className="hover:text-purple-500 text-xs">管理后台</a>
                )}
                <button onClick={logout} className="hover:text-red-500 flex items-center gap-1"><LogOut className="h-3 w-3" />退出</button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-red-500">登录</Link>
                <Link href="/register" className="hover:text-red-500">注册</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4">
        <Link href="/" className="text-2xl font-bold text-red-500 flex-shrink-0">
          优品商城
        </Link>

        <form onSubmit={handleSearch} className="flex flex-1 max-w-xl">
          <div className="relative flex w-full">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索商品"
              className="w-full rounded-l-full border-2 border-red-500 px-4 py-2 text-sm outline-none"
            />
            <button type="submit" className="rounded-r-full bg-red-500 px-6 text-white hover:bg-red-600">
              <Search className="h-5 w-5" />
            </button>
          </div>
        </form>

        <nav className="flex items-center gap-6 text-sm">
          <Link href="/cart" className="flex items-center gap-1 hover:text-red-500">
            <ShoppingCart className="h-5 w-5" />
            购物车
          </Link>
          <Link href="/orders" className="flex items-center gap-1 hover:text-red-500">
            <Package className="h-5 w-5" />
            我的订单
          </Link>
          <Link href="/notifications" className="flex items-center gap-1 hover:text-red-500">
            <Bell className="h-5 w-5" />
            消息
          </Link>
          <Link href="/profile" className="flex items-center gap-1 hover:text-red-500">
            <User className="h-5 w-5" />
            个人中心
          </Link>
        </nav>
      </div>

      {/* Category nav */}
      <CategoryNav />
    </header>
  );
}

function CategoryNav() {
  const cats = [
    { name: '手机数码', href: '/products?categoryId=1' },
    { name: '电脑办公', href: '/products?categoryId=2' },
    { name: '家用电器', href: '/products?categoryId=3' },
    { name: '服饰鞋包', href: '/products?categoryId=4' },
  ];
  return (
    <div className="border-t">
      <div className="mx-auto flex h-10 max-w-7xl items-center gap-6 px-4 text-sm">
        <Link href="/products" className="font-medium text-red-500">全部商品</Link>
        {cats.map((c) => (
          <Link key={c.name} href={c.href} className="text-gray-600 hover:text-red-500">{c.name}</Link>
        ))}
      </div>
    </div>
  );
}
