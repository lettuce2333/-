'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card } from '@zuoye/ui';
import { toast } from '@/components/toaster';

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
    <div className="p-6">
      <h1 className="mb-4 text-lg font-bold">类目管理</h1>
      <div className="mb-4 flex gap-2">
        <input className="rounded-lg border px-3 py-2 text-sm flex-1" placeholder="类目名称" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Button onClick={addCat}>添加</Button>
      </div>
      {loading ? <div className="h-32 animate-pulse rounded-lg bg-gray-200" /> : (
        <div className="space-y-2">
          {cats.map((c) => (
            <Card key={c.id} className="flex items-center justify-between px-6 py-3">
              <span className="text-sm font-medium">{c.name}</span>
              <Button size="sm" variant="ghost" onClick={() => deleteCat(c.id)} className="text-red-500">删除</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
