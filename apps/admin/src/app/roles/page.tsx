'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card, Badge } from '@zuoye/ui';
import { toast } from '@/components/toaster';

const roleLabels: Record<string, string> = {
  buyer: '买家',
  vip_buyer: 'VIP买家',
  shop_owner: '店主',
  shop_cs: '客服',
  shop_warehouse: '仓库',
  super_admin: '超级管理员',
  business_admin: '运营管理员',
  cs_admin: '客服管理员',
};

export default function AdminRolesPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  const fetchUsers = () => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    const params = keyword ? \`?keyword=${keyword}\` : '';
    api.get(\`/admin/users${params}\`).then((res) => {
      setUsers(res.data || []);
      setLoading(false);
    }).catch(() => router.push('/login'));
  };

  useEffect(() => { fetchUsers(); }, [router]);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">权限管理</h1>
        <div className="flex gap-2">
          <input
            placeholder="搜索用户..."
            className="rounded-lg border px-3 py-2 text-sm w-64"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
          />
          <Button size="sm" onClick={fetchUsers}>搜索</Button>
        </div>
      </div>
      {loading ? (
        <div className="h-48 animate-pulse rounded-lg bg-gray-200" />
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <p className="font-medium">{u.nickname || u.email}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{u.email} {u.phone && '|'} {u.phone}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {u.roles?.map((r: any) => (
                    <Badge key={r.id} variant={r.role === 'super_admin' ? 'danger' : r.role.startsWith('shop') ? 'info' : 'default'}>
                      {roleLabels[r.role] || r.role}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
          {users.length === 0 && <div className="py-20 text-center text-gray-400">暂无用户</div>}
        </div>
      )}
    </div>
  );
}