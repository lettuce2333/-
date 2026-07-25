'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button, Input } from '@zuoye/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuth((s) => s.login);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-16 max-w-md px-4">
      <h1 className="mb-8 text-center text-2xl font-bold">登录</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500">{error}</div>}
        <Input id="email" label="邮箱" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input id="password" label="密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" className="w-full" loading={loading}>登录</Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        还没有账号？<Link href="/register" className="text-red-500 hover:underline">立即注册</Link>
      </p>
      <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
        <p className="font-medium text-gray-700">测试账号：</p>
        <p>买家：buyer@zuoye.com / 123456</p>
        <p>商家：shop@zuoye.com / 123456</p>
        <p>管理员：admin@zuoye.com / 123456</p>
      </div>
    </div>
  );
}
