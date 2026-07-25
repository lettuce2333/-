'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card, Input } from '@zuoye/ui';
import { toast } from '@/components/toaster';
import { Store, UserPlus, Trash2 } from 'lucide-react';

export default function ShopSettingsPage() {
  const router = useRouter();
  const [shop, setShop] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', contactPhone: '' });
  const [saving, setSaving] = useState(false);
  const [newMember, setNewMember] = useState({ userId: '', role: 'shop_cs' });
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    api.get('/merchant/shop').then((res) => {
      setShop(res);
      if (res) {
        setForm({ name: res.name || '', description: res.description || '', contactPhone: res.contactPhone || '' });
        api.get(\`/merchant/shop/${res.id}/members\`).then((m) => setMembers(Array.isArray(m) ? m : []));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [router]);

  const saveShop = async () => {
    if (!shop?.id) return;
    setSaving(true);
    try {
      await api.put(\`/merchant/shop/${shop.id}\`, form);
      toast('保存成功', 'success');
    } catch (err: any) { toast(err.message, 'error'); } finally { setSaving(false); }
  };

  const addMember = async () => {
    if (!newMember.userId || !shop?.id) return;
    try {
      await api.post(\`/merchant/shop/${shop.id}/members\`, { userId: parseInt(newMember.userId), role: newMember.role });
      toast('添加成功', 'success');
      setAddingMember(false);
      setNewMember({ userId: '', role: 'shop_cs' });
      const m = await api.get(\`/merchant/shop/${shop.id}/members\`);
      setMembers(Array.isArray(m) ? m : []);
    } catch (err: any) { toast(err.message, 'error'); }
  };

  const removeMember = async (memberId: number) => {
    if (!shop?.id) return;
    try {
      await api.delete(\`/merchant/shop/${shop.id}/members/${memberId}\`);
      setMembers(members.filter((m) => m.id !== memberId));
      toast('已移除', 'success');
    } catch (err: any) { toast(err.message, 'error'); }
  };

  if (loading) return <div className="p-6"><div className="h-48 animate-pulse rounded-lg bg-gray-200" /></div>;
  if (!shop) return <div className="p-6 py-20 text-center text-gray-400">暂无店铺信息</div>;

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="mb-6 text-lg font-bold">店铺设置</h1>

      <Card className="mb-6 p-6 space-y-4">
        <Input label="店铺名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div>
          <label className="block text-sm font-medium text-gray-700">店铺描述</label>
          <textarea className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <Input label="联系电话" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
        <Button onClick={saveShop} loading={saving}>保存设置</Button>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-medium">店铺成员</h2>
          <Button size="sm" variant="outline" onClick={() => setAddingMember(!addingMember)}>
            <UserPlus className="mr-1 h-4 w-4" />添加成员
          </Button>
        </div>
        {addingMember && (
          <div className="mb-4 flex gap-2">
            <input placeholder="用户ID" type="number" className="flex-1 rounded-lg border px-3 py-2 text-sm" value={newMember.userId} onChange={(e) => setNewMember({ ...newMember, userId: e.target.value })} />
            <select className="rounded-lg border px-3 py-2 text-sm" value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}>
              <option value="shop_cs">客服</option>
              <option value="shop_warehouse">仓库</option>
            </select>
            <Button size="sm" onClick={addMember}>添加</Button>
          </div>
        )}
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <div className="text-sm">
                <p className="font-medium">{m.user?.nickname || m.user?.email}</p>
                <p className="text-xs text-gray-400">{m.role === 'shop_owner' ? '店主' : m.role === 'shop_cs' ? '客服' : '仓库'}</p>
              </div>
              {m.role !== 'shop_owner' && (
                <button onClick={() => removeMember(m.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}