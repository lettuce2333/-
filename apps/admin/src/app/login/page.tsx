'use client';
import { useEffect, useState } from 'react';
import { Button, Input } from '@zuoye/ui';
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
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold">管理后台</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500">{error}</div>}
          <Input id="email" label="邮箱" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input id="password" label="密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full" loading={loading}>登录</Button>
        </form>
        <p className="mt-4 text-center text-xs text-gray-400">
        <a href="http://localhost:3000/login" className="text-blue-500 hover:underline">统一登录入口</a> | 测试：admin@zuoye.com / 123456</p>
      </div>
    </div>
  );
}