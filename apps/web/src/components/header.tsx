'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Search, ShoppingCart, User, LogOut, Package, Bell, ChevronDown } from 'lucide-react';
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
    <header className="sticky top-0 z-40 bg-[var(--color-surface)]/95 backdrop-blur-sm border-b border-[var(--color-border-light)] shadow-sm">
      {/* Top bar */}
      <div className="bg-[var(--color-surface-2)] text-xs text-[var(--color-muted)]">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4">
          <span className="tracking-wide">优品商城 — 品质生活从这里开始</span>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/profile" className="hover:text-[var(--color-accent)] transition-colors">Hi, {user.nickname || user.email}</Link>
               {user.roles?.some((r: any) => r.role === 'shop_owner' || r.role === 'shop_cs') && (
                  <a href={"http://localhost:3001/auth/callback?token=".concat(encodeURIComponent(localStorage.getItem("token") || ""))} className="hover:text-[var(--color-warning)] transition-colors">商家后台</a>
               )}
               {user.roles?.some((r: any) => r.role === 'super_admin' || r.role === 'business_admin' || r.role === 'cs_admin') && (
                  <a href={"http://localhost:3002/auth/callback?token=".concat(encodeURIComponent(localStorage.getItem("token") || ""))} className="hover:text-[var(--color-info)] transition-colors">管理后台</a>
               )}
                <button onClick={logout} className="hover:text-[var(--color-accent)] transition-colors flex items-center gap-1"><LogOut className="h-3 w-3" />退出</button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-[var(--color-accent)] transition-colors">登录</Link>
                <Link href="/register" className="hover:text-[var(--color-accent)] transition-colors">注册</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4">
        <Link href="/" className="text-2xl font-bold tracking-tight text-[var(--color-accent)] flex-shrink-0">
          优品商城
        </Link>

        <form onSubmit={handleSearch} className="flex flex-1 max-w-xl group">
          <div className="relative flex w-full">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索商品"
              className="w-full rounded-l-[var(--radius-lg)] border-2 border-[var(--color-accent)] border-r-0 px-4 py-2 text-sm bg-[var(--color-surface)] placeholder:text-[var(--color-muted)] focus:outline-none transition-shadow"
            />
            <button type="submit" className="rounded-r-[var(--radius-lg)] bg-[var(--color-accent)] px-5 text-white hover:bg-[var(--color-accent-hover)] transition-colors active:scale-[0.97]">
              <Search className="h-5 w-5" />
            </button>
          </div>
        </form>

        <nav className="flex items-center gap-5 text-sm">
          <Link href="/cart" className="flex items-center gap-1.5 text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors">
            <ShoppingCart className="h-5 w-5" />
            <span className="hidden sm:inline">购物车</span>
          </Link>
          <Link href="/orders" className="flex items-center gap-1.5 text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors">
            <Package className="h-5 w-5" />
            <span className="hidden sm:inline">我的订单</span>
          </Link>
          <Link href="/notifications" className="flex items-center gap-1.5 text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors">
            <Bell className="h-5 w-5" />
            <span className="hidden sm:inline">消息</span>
          </Link>
          <Link href="/profile" className="flex items-center gap-1.5 text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors">
            <User className="h-5 w-5" />
            <span className="hidden sm:inline">个人中心</span>
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
    <div className="border-t border-[var(--color-border-light)]">
      <div className="mx-auto flex h-10 max-w-7xl items-center gap-6 px-4 text-sm">
        <Link href="/products" className="font-medium text-[var(--color-accent)] relative after:absolute after:bottom-[-1px] after:left-0 after:h-[2px] after:w-full after:bg-[var(--color-accent)]">
          全部商品
        </Link>
        {cats.map((c) => (
          <Link key={c.name} href={c.href} className="text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors">{c.name}</Link>
        ))}
      </div>
    </div>
  );
}
