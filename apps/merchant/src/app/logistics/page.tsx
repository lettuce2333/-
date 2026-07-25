'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card } from '@zuoye/ui';
import { toast } from '@/components/toaster';
import { Truck, Plus, Trash2 } from 'lucide-react';

export default function LogisticsPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', company: '', price: '' });

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/merchant/logistics-templates');
      setTemplates(Array.isArray(res) ? res : []);
      setLoading(false);
    } catch { setLoading(false); }
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    fetchTemplates();
  }, [router]);

  const startEdit = (t: any) => {
    setForm({ name: t.name, company: t.company, price: String(t.price) });
    setEditingId(t.id); setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false); setEditingId(null);
    setForm({ name: '', company: '', price: '' });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.company || !form.price) { toast('请填写完整信息', 'error'); return; }
    try {
      const payload = { name: form.name, company: form.company, price: parseFloat(form.price) };
      if (editingId) {
        await api.put(\`/merchant/logistics-templates/${editingId}\`, payload);
        toast('更新成功', 'success');
      } else {
        await api.post('/merchant/logistics-templates', payload);
        toast('添加成功', 'success');
      }
      cancelForm(); fetchTemplates();
    } catch (err: any) { toast(err.message, 'error'); }
  };

  const handleDelete = async (id: number) => {
    try { await api.delete(\`/merchant/logistics-templates/${id}\`); setTemplates(templates.filter((t) => t.id !== id)); toast('已删除', 'success'); } catch (err: any) { toast(err.message, 'error'); }
  };

  if (loading) return <div className="p-6"><div className="h-32 animate-pulse rounded-lg bg-gray-200" /></div>;

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">物流模板</h1>
        <Button size="sm" onClick={() => { cancelForm(); setShowForm(!showForm); }}><Plus className="mr-1 h-4 w-4" />{showForm ? '关闭' : '新建'}</Button>
      </div>

      {showForm && (
        <Card className="mb-4 p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="模板名称" className="rounded-lg border px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input placeholder="快递公司" className="rounded-lg border px-3 py-2 text-sm" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <input placeholder="运费" type="number" className="rounded-lg border px-3 py-2 text-sm" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit}>{editingId ? '更新' : '添加'}</Button>
            {editingId && <Button size="sm" variant="outline" onClick={cancelForm}>取消</Button>}
          </div>
        </Card>
      )}

      {templates.length === 0 ? (
        <div className="py-20 text-center text-gray-400"><Truck className="mx-auto h-12 w-12 text-gray-300" /><p className="mt-2">暂无物流模板</p></div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <Card key={t.id} className="flex items-center justify-between px-6 py-4">
              <div className="text-sm">
                <p className="font-medium">{t.name}</p>
                <p className="mt-1 text-xs text-gray-400">{t.company} | 运费 ¥{t.price}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => startEdit(t)} className="text-xs text-blue-500 hover:underline">编辑</button>
                <button onClick={() => handleDelete(t.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}