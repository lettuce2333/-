'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button, Input } from '@zuoye/ui';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuth((s) => s.register);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, nickname);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-16 max-w-md px-4">
      <h1 className="mb-8 text-center text-2xl font-bold">注册</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500">{error}</div>}
        <Input id="email" label="邮箱" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input id="nickname" label="昵称" value={nickname} onChange={(e) => setNickname(e.target.value)} />
        <Input id="password" label="密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        <Button type="submit" className="w-full" loading={loading}>注册</Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        已有账号？<Link href="/login" className="text-red-500 hover:underline">立即登录</Link>
      </p>
    </div>
  );
}
