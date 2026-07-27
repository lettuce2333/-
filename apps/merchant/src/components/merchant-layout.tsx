'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Package, ShoppingBag, MessageSquare, Settings, BarChart3, Store, Star, Truck, LogOut, ExternalLink } from 'lucide-react';

const nav = [
  { href: '/dashboard', label: '工作台', icon: BarChart3 },
  { href: '/orders', label: '订单管理', icon: Package },
  { href: '/products', label: '商品管理', icon: ShoppingBag },
  { href: '/after-sales', label: '售后管理', icon: MessageSquare },
  { href: '/reviews', label: '评价管理', icon: Star },
  { href: '/logistics', label: '物流模板', icon: Truck },
  { href: '/shop', label: '店铺设置', icon: Settings },
  { href: '/stats', label: '数据统计', icon: BarChart3 },
];

export function MerchantLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-[var(--color-sidebar)] flex-shrink-0 flex flex-col">
        <div className="px-5 py-5 border-b border-white/5">
          <span className="text-lg font-bold text-white">商家后台</span>
          <p className="mt-0.5 text-xs text-[var(--color-sidebar-text)]">优品商城</p>
        </div>
        <nav className="mt-3 flex-1 space-y-0.5 px-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm transition-all duration-150 ${
                  active ? 'bg-white/10 text-white font-medium' : 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)] hover:text-white'
                }`}>
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-3 border-t border-white/5">
          <a href="http://localhost:3000"
            className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)] hover:text-white transition-colors mb-1">
            <ExternalLink className="h-4 w-4" />
            <span>返回首页</span>
          </a>
          <button onClick={() => { localStorage.removeItem('token'); window.location.href = 'http://localhost:3000/login'; }}
            className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)] hover:text-white transition-colors">
            <LogOut className="h-4 w-4" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 bg-[var(--color-bg)] flex flex-col">
        <header className="flex h-14 items-center justify-between bg-[var(--color-surface)] border-b border-[var(--color-border-light)] px-6 shadow-sm">
          <h1 className="text-base font-bold text-[var(--color-ink)]">{title}</h1>
        </header>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
