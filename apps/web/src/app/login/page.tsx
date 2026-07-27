'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button, Input, Card } from '@zuoye/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const token = res.accessToken;
      const roles = res.user?.roles || [];
      localStorage.setItem('token', token);

     if (roles.includes('super_admin') || roles.includes('business_admin') || roles.includes('cs_admin')) {
        window.location.href = 'http://localhost:3002/auth/callback?token=' + encodeURIComponent(token);
      } else if (roles.includes('shop_owner') || roles.includes('shop_cs') || roles.includes('shop_warehouse')) {
        window.location.href = 'http://localhost:3001/auth/callback?token=' + encodeURIComponent(token);
      } else {
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-16 mb-16 max-w-md px-4">
      <Card className="!p-0 overflow-hidden">
        <div className="bg-[var(--color-accent)] px-8 py-6 text-white">
          <h1 className="text-xl font-bold tracking-tight">登录</h1>
          <p className="mt-1 text-sm opacity-80">登录优品商城，发现品质生活</p>
        </div>
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="rounded-[var(--radius-sm)] bg-red-50 border border-red-100 p-3 text-sm text-[var(--color-danger)]">{error}</div>}
            <Input id="email" label="邮箱" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="请输入邮箱" />
            <Input id="password" label="密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="请输入密码" />
            <Button type="submit" className="w-full" size="lg" loading={loading}>登录</Button>
          </form>
          <p className="mt-5 text-center text-sm text-[var(--color-muted)]">
            还没有账号？<Link href="/register" className="text-[var(--color-accent)] hover:underline font-medium">立即注册</Link>
          </p>
        </div>
      </Card>
      <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border-light)] p-4 text-sm">
        <p className="font-medium text-[var(--color-ink)] mb-2">测试账号</p>
        <div className="space-y-1 text-[var(--color-muted)]">
          <p>买家：buyer@zuoye.com / 123456</p>
          <p>商家：shop@zuoye.com / 123456</p>
          <p>管理员：admin@zuoye.com / 123456</p>
        </div>
      </div>
    </div>
  );
}
