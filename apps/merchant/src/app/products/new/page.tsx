'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card, Input } from '@zuoye/ui';
import { toast } from '@/components/toaster';

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', categoryId: 1, description: '', price: '', totalStock: '' });
  const [skus, setSkus] = useState([{ specs: '{}', price: '', stock: '' }]);
  const [submitting, setSubmitting] = useState(false);

  const addSku = () => setSkus([...skus, { specs: '{}', price: '', stock: '' }]);
  const updateSku = (i: number, field: string, val: string) => {
    const next = [...skus]; next[i] = { ...next[i], [field]: val }; setSkus(next);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post('/merchant/products', {
        name: form.name,
        categoryId: parseInt(form.categoryId as any),
        description: form.description,
        skus: skus.map((s) => ({
          specs: JSON.parse(s.specs || '{}'),
          price: parseFloat(s.price),
          stock: parseInt(s.stock),
        })),
      });
      toast('商品创建成功', 'success');
      router.push('/products');
    } catch (err: any) { toast(err.message, 'error'); } finally { setSubmitting(false); }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="mb-6 text-lg font-bold">新增商品</h1>
      <Card className="p-6 space-y-4">
        <Input label="商品名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div>
          <label className="block text-sm font-medium text-gray-700">类目ID</label>
          <input type="number" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: parseInt(e.target.value) })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">商品描述</label>
          <textarea className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="border-t pt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">SKU</span>
            <Button size="sm" variant="outline" onClick={addSku}>添加SKU</Button>
          </div>
          {skus.map((sku, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <input placeholder='规格JSON (如{"颜色":"红"})' className="flex-1 rounded-lg border px-3 py-2 text-sm" value={sku.specs} onChange={(e) => updateSku(i, 'specs', e.target.value)} />
              <input placeholder="价格" type="number" className="w-24 rounded-lg border px-3 py-2 text-sm" value={sku.price} onChange={(e) => updateSku(i, 'price', e.target.value)} />
              <input placeholder="库存" type="number" className="w-24 rounded-lg border px-3 py-2 text-sm" value={sku.stock} onChange={(e) => updateSku(i, 'stock', e.target.value)} />
            </div>
          ))}
        </div>
        <Button onClick={handleSubmit} loading={submitting}>保存商品</Button>
      </Card>
    </div>
  );
}
