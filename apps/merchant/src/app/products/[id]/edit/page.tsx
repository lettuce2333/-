'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card, Input } from '@zuoye/ui';
import { toast } from '@/components/toaster';
import { MerchantLayout } from '@/components/merchant-layout';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState({ name: '', categoryId: '', description: '' });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [skus, setSkus] = useState<any[]>([]);

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    api.get('/categories').then((res) => {
      const data = Array.isArray(res) ? res : [];
      const flat: { id: number; name: string }[] = data.map((c: any) => ({ id: c.id, name: c.name }));
      setCategories(flat);
    });
    api.get('/merchant/products').then((res: any) => {
      const products = res.data || [];
      const product = products.find((p: any) => p.id === parseInt(id));
      if (product) {
        setForm({ name: product.name, categoryId: String(product.categoryId), description: product.description || '' });
        try { const imgs = JSON.parse(product.images || '[]'); setImages(Array.isArray(imgs) ? imgs : []); } catch { setImages([]); }
        setSkus(product.skus || []);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, router]);

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const form = new FormData(); form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
      const data = await res.json();
      setImages([...images, data.url]);
    } catch (err: any) { toast(err.message, 'error'); } finally { setUploading(false); e.target.value = ''; }
  };

  const addSku = () => setSkus([...skus, { specs: '{}', price: 0, stock: 0 }]);
  const updateSku = (i: number, field: string, val: any) => {
    const next = [...skus]; next[i] = { ...next[i], [field]: val }; setSkus(next);
  };
  const removeSku = (i: number) => setSkus(skus.filter((_, idx) => idx !== i));
  const safeParseSpecs = (specs: any) => {
    if (typeof specs === 'object' && specs !== null) return specs;
    try { return JSON.parse(specs || '{}'); } catch { return {}; }
  };

  const handleSubmit = async () => {
    if (!form.categoryId) { toast('请选择类目', 'error'); return; }
    for (let i = 0; i < skus.length; i++) {
      const raw = typeof skus[i].specs === 'string' ? skus[i].specs : JSON.stringify(skus[i].specs || {});
      try {
        JSON.parse(raw);
      } catch {
        toast(`第 ${i + 1} 个 SKU 的规格格式不正确，请填写合法的 JSON，如 {"颜色":"红"}`, 'error');
        return;
      }
    }
    setSubmitting(true);
    try {
      await api.put(`/merchant/products/${id}`, {
        name: form.name, categoryId: parseInt(form.categoryId), description: form.description,
        images, price: skus[0]?.price || 0,
        skus: skus.map((s) => ({ specs: safeParseSpecs(s.specs), price: s.price, stock: s.stock }))
      });
      toast('保存成功', 'success'); router.push('/products');
    } catch (err: any) { toast(err.message, 'error'); } finally { setSubmitting(false); }
  };

  if (loading) return <MerchantLayout title="编辑商品"><div className="p-6 max-w-2xl"><div className="h-48 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-2)]" /></div></MerchantLayout>;

  return (
    <MerchantLayout title="编辑商品">
      <div className="p-6 max-w-2xl">
        <Card className="p-6 space-y-4" accent>
          <Input label="商品名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)]">类目</label>
            <select className="mt-1 block w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)]">商品描述</label>
            <textarea className="mt-1 block w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">商品图片</label>
            <div className="flex flex-wrap gap-3">
              {images.map((url, i) => (
                <div key={i} className="relative h-24 w-24 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)]">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-xs text-white">×</button>
                </div>
              ))}
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-[var(--radius-sm)] border-2 border-dashed border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-muted)]">
                {uploading ? <span className="text-xs animate-pulse">上传中...</span> : <><span className="text-2xl">+</span><span className="mt-1 text-xs">上传图片</span></>}
                <input type="file" accept="image/*" onChange={uploadImage} className="hidden" />
              </label>
            </div>
          </div>
          <div className="border-t border-[var(--color-border-light)] pt-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-ink)]">SKU ({skus.length})</span>
              <Button size="sm" variant="outline" onClick={addSku}>添加SKU</Button>
            </div>
            {skus.map((sku, i) => (
              <div key={i} className="mb-2 flex gap-2 items-center">
                <input placeholder='规格JSON' className="flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm" value={sku.specs} onChange={(e) => updateSku(i, 'specs', e.target.value)} />
                <input placeholder="价格" type="number" className="w-24 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm" value={sku.price} onChange={(e) => updateSku(i, 'price', parseFloat(e.target.value) || 0)} />
                <input placeholder="库存" type="number" className="w-24 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm" value={sku.stock} onChange={(e) => updateSku(i, 'stock', parseInt(e.target.value) || 0)} />
                <button onClick={() => removeSku(i)} className="text-[var(--color-muted)] hover:text-[var(--color-danger)] text-lg">×</button>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSubmit} loading={submitting}>保存</Button>
            <Button variant="outline" onClick={() => router.push('/products')}>取消</Button>
          </div>
        </Card>
      </div>
    </MerchantLayout>
  );
}
