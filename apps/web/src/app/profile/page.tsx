'use client';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { Card } from '@zuoye/ui';
import { User, MapPin, Heart, Star, Package, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return <div className="py-20 text-center text-gray-400">请先登录</div>;

  const links = [
    { href: '/profile/addresses', label: '收货地址', icon: MapPin },
    { href: '/orders', label: '我的订单', icon: Package },
    { href: '/profile/favorites', label: '我的收藏', icon: Heart },
    { href: '/profile/reviews', label: '我的评价', icon: Star },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Card className="mb-6">
        <div className="flex items-center gap-4 px-6 py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl text-red-500">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{user.nickname || user.email}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="flex items-center gap-3 px-6 py-4 hover:shadow-md transition-shadow">
              <l.icon className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium">{l.label}</span>
            </Card>
          </Link>
        ))}
      </div>

      <button onClick={logout} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-6 py-3 text-sm text-gray-600 hover:bg-gray-200">
        <LogOut className="h-4 w-4" />退出登录
      </button>
    </div>
  );
}
