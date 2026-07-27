'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Users, Store, Package, ShoppingBag, MessageSquare, Settings, BarChart3, Layers, LogOut } from 'lucide-react';

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

export function AdminLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-[var(--color-sidebar)] flex-shrink-0 flex flex-col">
        <div className="px-5 py-5 border-b border-white/5">
          <span className="text-lg font-bold text-white">管理后台</span>
          <p className="mt-0.5 text-xs text-[var(--color-sidebar-text)]">优品商城</p>
        </div>
        <nav className="mt-3 flex-1 space-y-0.5 px-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
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
          <button onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
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
