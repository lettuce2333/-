'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card, Badge } from '@zuoye/ui';
import { toast } from '@/components/toaster';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    api.get('/admin/users').then((res) => { setUsers(res.data || []); setLoading(false); });
  }, [router]);

  const toggleStatus = async (id: number) => {
    try { await api.post(`/admin/users/${id}/toggle-status`); toast('状态已更新', 'success'); window.location.reload(); } catch (err: any) { toast(err.message, 'error'); }
  };

  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-bold">用户管理</h1>
      {loading ? <div className="h-32 animate-pulse rounded-lg bg-gray-200" /> : (
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.id} className="flex items-center justify-between px-6 py-4">
              <div className="text-sm">
                <p className="font-medium">{u.nickname || '未设置'} <span className="text-gray-400">({u.email})</span></p>
                <p className="mt-1 text-xs text-gray-400">角色：{u.roles?.map((r: any) => r.role).join(', ')} | 注册时间：{new Date(u.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={u.status === 'active' ? 'success' : 'danger'}>{u.status === 'active' ? '正常' : '封禁'}</Badge>
                <Button size="sm" variant={u.status === 'active' ? 'danger' : 'secondary'} onClick={() => toggleStatus(u.id)}>
                  {u.status === 'active' ? '封禁' : '解封'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
