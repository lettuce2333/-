'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card } from '@zuoye/ui';
import { toast } from '@/components/toaster';
import { AdminLayout } from '@/components/admin-layout';

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');

  const load = () => api.get('/categories/tree').then((res) => { setCats(Array.isArray(res) ? res : []); setLoading(false); });
  useEffect(() => { if (!localStorage.getItem('token')) { router.push('/login'); return; } load(); }, [router]);

  const addCat = async () => {
    if (!newName) return;
    try { await api.post('/admin/categories', { name: newName }); toast('添加成功', 'success'); setNewName(''); load(); } catch (err: any) { toast(err.message, 'error'); }
  };

  const deleteCat = async (id: number) => {
    try { await api.delete(`/admin/categories/${id}`); toast('已删除', 'success'); load(); } catch (err: any) { toast(err.message, 'error'); }
  };

  return (
    <AdminLayout title="类目管理">
      <div className="p-6">
        <div className="mb-4 flex gap-2">
          <input className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)] flex-1" placeholder="类目名称" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button onClick={addCat}>添加</Button>
        </div>
        {loading ? <div className="h-32 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-2)]" /> : (
          <div className="space-y-2">
            {cats.map((c) => (
              <Card key={c.id} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm font-medium text-[var(--color-ink)]">{c.name}</span>
                <Button size="sm" variant="ghost" onClick={() => deleteCat(c.id)} className="text-[var(--color-danger)]">删除</Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
