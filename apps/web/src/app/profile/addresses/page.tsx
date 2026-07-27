'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@zuoye/ui';
import { toast } from '@/components/toaster';
import { Plus, Trash2 } from 'lucide-react';

export default function AddressesPage() {
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ receiver: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false });

  useEffect(() => { if (!user) { router.push('/login'); return; }
    api.get('/users/addresses').then((res) => { setAddresses(Array.isArray(res) ? res : []); setLoading(false); });
  }, [user, router]);

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await api.put(`/users/addresses/${editingId}`, form);
        toast('更新成功', 'success');
      } else {
        await api.post('/users/addresses', form);
        toast('添加成功', 'success');
      }
      setShowForm(false);
      setEditingId(null);
      window.location.reload();
    } catch (err: any) { toast(err.message, 'error'); }
  };

  const startEdit = (addr: any) => {
    setForm({ receiver: addr.receiver, phone: addr.phone, province: addr.province, city: addr.city, district: addr.district, detail: addr.detail, isDefault: addr.isDefault });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ receiver: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false });
  };

  const handleDelete = async (id: number) => {
    try { await api.delete(`/users/addresses/${id}`); setAddresses(addresses.filter((a) => a.id !== id)); toast('已删除', 'success'); } catch (err: any) { toast(err.message, 'error'); }
  };

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-8"><div className="h-32 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-2)]" /></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--color-ink)]">收货地址</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="mr-1 h-4 w-4" />新增地址</Button>
      </div>

      {showForm && (
        <Card className="mb-4" accent>
          <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-5 py-3">
            <span className="font-medium text-sm text-[var(--color-ink)]">{editingId ? '编辑地址' : '新增地址'}</span>
            <button onClick={cancelForm} className="text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)]">取消</button>
          </div>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="收件人" className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)]" value={form.receiver} onChange={(e) => setForm({ ...form, receiver: e.target.value })} />
              <input placeholder="手机号" className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)]" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input placeholder="省" className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)]" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} />
              <input placeholder="市" className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)]" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <input placeholder="区" className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)]" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
            </div>
            <input placeholder="详细地址" className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)]" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="accent-[var(--color-accent)]" />
              设为默认地址
            </label>
            <Button onClick={handleSubmit}>保存</Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {addresses.map((addr) => (
          <Card key={addr.id} accent className="flex items-center justify-between px-5 py-4">
            <div className="text-sm">
              <p><span className="font-medium text-[var(--color-ink)]">{addr.receiver}</span> <span className="text-[var(--color-muted)]">{addr.phone}</span> {addr.isDefault && <span className="ml-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)]/10 px-2 py-0.5 text-xs text-[var(--color-accent)]">默认</span>}</p>
              <p className="mt-1 text-[var(--color-muted)]">{addr.province}{addr.city}{addr.district} {addr.detail}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => startEdit(addr)} className="text-[var(--color-muted)] hover:text-[var(--color-info)] text-xs">编辑</button>
              <button onClick={() => handleDelete(addr.id)} className="text-[var(--color-muted)] hover:text-[var(--color-danger)]"><Trash2 className="h-4 w-4" /></button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
