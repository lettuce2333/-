'use client';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { Card } from '@zuoye/ui';
import { User, MapPin, Heart, Star, Package, LogOut, Gavel, Coins } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return <div className="py-24 text-center text-[var(--color-muted)]">请先登录</div>;

  const links = [
    { href: '/profile/addresses', label: '收货地址', icon: MapPin },
    { href: '/orders', label: '我的订单', icon: Package },
    { href: '/profile/favorites', label: '我的收藏', icon: Heart },
    { href: '/profile/reviews', label: '我的评价', icon: Star },
    { href: '/court', label: '小法庭大厅', icon: Gavel },
    { href: '/profile/court', label: '我的小法庭', icon: Gavel },
    { href: '/profile/tokens', label: '法庭币钱包', icon: Coins },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Card className="mb-6 overflow-hidden" accent>
        <div className="flex items-center gap-4 px-6 py-6 bg-gradient-to-r from-[var(--color-accent)]/5 to-transparent">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-2xl text-[var(--color-accent)]">
            <User className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--color-ink)]">{user.nickname || user.email}</h2>
            <p className="text-sm text-[var(--color-muted)]">{user.email}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="flex items-center gap-3 px-5 py-4 group">
              <l.icon className="h-5 w-5 text-[var(--color-muted)]" />
              <span className="text-sm font-medium text-[var(--color-ink)]">{l.label}</span>
              <span className="ml-auto text-[var(--color-muted)] group-hover:text-[var(--color-accent)] transition-colors">&rarr;</span>
            </Card>
          </Link>
        ))}
      </div>

      <button onClick={logout} className="mt-6 flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:border-[var(--color-danger)] transition-colors">
        <LogOut className="h-4 w-4" />退出登录
      </button>
    </div>
  );
}
