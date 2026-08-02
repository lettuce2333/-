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
  const [form, setForm] = useState({ name: '', categoryId: '', description: '', price: '' });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [variants, setVariants] = useState([{ name: '', stock: '', price: '' }]);

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
        setForm({ name: product.name, categoryId: String(product.categoryId), description: product.description || '', price: String(product.price || '') });
        try { const imgs = JSON.parse(product.images || '[]'); setImages(Array.isArray(imgs) ? imgs : []); } catch { setImages([]); }
        const skus = product.skus || [];
        if (skus.length > 0) {
          setVariants(skus.map((s: any) => ({ name: s.specs || '', stock: String(s.stock || 0), price: s.price !== undefined && s.price !== null ? String(s.price) : '' })));
        }
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, router]);

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const fm = new FormData(); fm.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fm });
      const data = await res.json();
      setImages([...images, data.url]);
    } catch (err: any) { toast(err.message, 'error'); } finally { setUploading(false); e.target.value = ''; }
  };

  const addVariant = () => setVariants([...variants, { name: '', stock: '', price: '' }]);
  const updateVariant = (i: number, field: string, val: string) => {
    const next = [...variants]; next[i] = { ...next[i], [field]: val }; setVariants(next);
  };
  const removeVariant = (i: number) => setVariants(variants.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!form.categoryId) { toast('请选择类目', 'error'); return; }
    const validVariants = variants.filter(v => v.name.trim());
    if (validVariants.length === 0) { toast('请至少添加一个种类', 'error'); return; }
    setSubmitting(true);
    try {
      await api.put(`/merchant/products/${id}`, {
        name: form.name, categoryId: parseInt(form.categoryId), description: form.description,
        images, price: parseFloat(form.price) || 0,
        variants: validVariants.map(v => ({
          name: v.name.trim(),
          stock: parseInt(v.stock) || 0,
          price: v.price === '' ? undefined : parseFloat(v.price) || 0,
        })),
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
              {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <Input label="价格" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />

          <div className="border-t border-[var(--color-border-light)] pt-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-ink)]">种类</span>
              <Button size="sm" variant="outline" onClick={addVariant}>添加种类</Button>
            </div>
            {variants.map((v, i) => (
              <div key={i} className="mb-2 flex gap-2 items-center">
                <input placeholder="种类名称" className="flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm" value={v.name} onChange={(e) => updateVariant(i, 'name', e.target.value)} />
                <input placeholder="库存" type="number" className="w-24 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm" value={v.stock} onChange={(e) => updateVariant(i, 'stock', e.target.value)} />
                <input placeholder="价格" type="number" className="w-24 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm" value={v.price} onChange={(e) => updateVariant(i, 'price', e.target.value)} />
                {variants.length > 1 && (
                  <button onClick={() => removeVariant(i)} className="text-red-400 hover:text-red-600 text-sm">删除</button>
                )}
              </div>
            ))}
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
          <Button onClick={handleSubmit} loading={submitting}>保存商品</Button>
        </Card>
      </div>
    </MerchantLayout>
  );
}
