'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@zuoye/ui';
import { api } from '@/lib/api';

export default function MerchantLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.accessToken);
      router.push('/dashboard');
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold">商家后台</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500">{error}</div>}
          <Input id="email" label="邮箱" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input id="password" label="密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full" loading={loading}>登录</Button>
        </form>
        <p className="mt-4 text-center text-xs text-gray-400">测试账号：shop@zuoye.com / 123456</p>
      </div>
    </div>
  );
}
