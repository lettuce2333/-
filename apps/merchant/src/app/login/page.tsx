'use client';
import { useEffect, useState } from 'react';
import { Button, Input, Card } from '@zuoye/ui';
import { api } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      window.location.href = '/dashboard';
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.accessToken);
      window.location.href = '/dashboard';
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
      <div className="w-full max-w-sm px-4">
        <Card className="overflow-hidden !p-0">
          <div className="bg-[var(--color-sidebar)] px-8 py-6 text-center">
            <h1 className="text-xl font-bold text-white">商家后台</h1>
            <p className="mt-1 text-sm text-[var(--color-sidebar-text)]">优品商城商家管理平台</p>
          </div>
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded-[var(--radius-sm)] bg-red-50 border border-red-100 p-3 text-sm text-[var(--color-danger)]">{error}</div>}
              <Input id="email" label="邮箱" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="shop@zuoye.com" />
              <Input id="password" label="密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="输入密码" />
              <Button type="submit" className="w-full" size="lg" loading={loading}>登录</Button>
            </form>
            <p className="mt-5 text-center text-xs text-[var(--color-muted)]">
              <a href="http://localhost:3000/login" className="text-[var(--color-accent)] hover:underline font-medium">统一登录入口</a>
            </p>
          </div>
        </Card>
        <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border-light)] p-4 text-sm text-[var(--color-muted)] text-center">
          测试：shop@zuoye.com / 123456
        </div>
      </div>
    </div>
  );
}
