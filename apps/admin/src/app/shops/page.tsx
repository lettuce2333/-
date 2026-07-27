'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card, Badge } from '@zuoye/ui';
import { toast } from '@/components/toaster';
import { AdminLayout } from '@/components/admin-layout';

const sl: Record<string, string> = { pending: '待审核', active: '营业中', rejected: '已拒绝', banned: '已封禁' };
const sv: Record<string, string> = { pending: 'warning', active: 'success', rejected: 'danger', banned: 'default' };

export default function AdminShopsPage() {
  const router = useRouter();
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    api.get('/admin/shops').then((res) => { setShops(res.data || []); setLoading(false); });
  }, [router]);

  const handleAction = async (id: number, action: string, msg: string) => {
    try { await api.post(`/admin/shops/${id}/${action}`); toast(msg, 'success'); window.location.reload(); } catch (err: any) { toast(err.message, 'error'); }
  };

  return (
    <AdminLayout title="店铺管理">
      <div className="p-6">
        {loading ? <div className="h-32 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-2)]" /> : (
          <div className="space-y-3">
            {shops.map((s) => (
              <Card key={s.id} accent className="flex items-center justify-between px-5 py-4">
                <div className="text-sm">
                  <p className="font-medium text-[var(--color-ink)]">{s.name}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">店主：{s.owner?.nickname || '-'} | {s.contactPhone || '-'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={(sv[s.status] || 'default') as any}>{sl[s.status] || s.status}</Badge>
                  {s.status === 'pending' && <><Button size="sm" onClick={() => handleAction(s.id, 'approve', '已通过')}>通过</Button><Button size="sm" variant="outline" onClick={() => handleAction(s.id, 'reject', '已拒绝')}>拒绝</Button></>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
