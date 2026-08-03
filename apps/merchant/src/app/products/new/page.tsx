'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card, Input } from '@zuoye/ui';
import { toast } from '@/components/toaster';
import { MerchantLayout } from '@/components/merchant-layout';

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState({ name: '', categoryId: '', description: '', price: '', tokenPrice: '' });
  const [variants, setVariants] = useState([{ name: '', stock: '', price: '' }]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/categories').then((res) => {
      const data = Array.isArray(res) ? res : [];
      const flat: { id: number; name: string }[] = data.map((c: any) => ({ id: c.id, name: c.name }));
      setCategories(flat);
      if (flat.length > 0) setForm(f => ({ ...f, categoryId: String(flat[0].id) }));
    });
  }, []);

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const fm = new FormData();
      fm.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fm });
      if (!res.ok) throw new Error("上传失败");
      const data = await res.json();
      setImages([...images, data.url]);
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (idx: number) => setImages(images.filter((_, i) => i !== idx));

  const addVariant = () => setVariants([...variants, { name: '', stock: '', price: '' }]);
  const removeVariant = (i: number) => setVariants(variants.filter((_, idx) => idx !== i));
  const updateVariant = (i: number, field: string, val: string) => {
    const next = [...variants]; next[i] = { ...next[i], [field]: val }; setVariants(next);
  };

  const handleSubmit = async () => {
    if (!form.name) { toast('请输入商品名称', 'error'); return; }
    if (!form.categoryId) { toast('请选择类目', 'error'); return; }
    const validVariants = variants.filter(v => v.name.trim());
    if (validVariants.length === 0) { toast('请至少添加一个种类', 'error'); return; }
    setSubmitting(true);
    try {
      await api.post('/merchant/products', {
        name: form.name,
        categoryId: parseInt(form.categoryId),
        description: form.description,
        price: parseFloat(form.price) || 0.01,
        tokenPrice: form.tokenPrice,
        images: images,
        variants: validVariants.map(v => ({
          name: v.name.trim(),
          stock: parseInt(v.stock) || 0,
          price: v.price === '' ? undefined : parseFloat(v.price) || 0,
        })),
      });
      toast('商品创建成功', 'success');
      router.push('/products');
    } catch (err: any) { toast(err.message, 'error'); } finally { setSubmitting(false); }
  };

  return (
    <MerchantLayout title="新增商品">
      <div className="p-6 max-w-2xl">
        <Card className="p-6 space-y-4" accent>
          <Input label="商品名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)]">类目</label>
            <select className="mt-1 block w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <Input label="价格" type="number" placeholder="0.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <Input label="法庭币兑换价" type="number" placeholder="0 表示不支持兑换" value={form.tokenPrice} onChange={(e) => setForm({ ...form, tokenPrice: e.target.value })} />

          {/* Variants sub-form */}
          <div className="border-t border-[var(--color-border-light)] pt-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-ink)]">种类</span>
              <Button size="sm" variant="outline" onClick={addVariant}>添加种类</Button>
            </div>
            {variants.map((v, i) => (
              <div key={i} className="mb-2 flex gap-2 items-center">
                <input placeholder="种类名称（如：银色256GB）" className="flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm" value={v.name} onChange={(e) => updateVariant(i, 'name', e.target.value)} />
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
                  <button onClick={() => removeImage(i)} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-xs text-white hover:bg-black/70">×</button>
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
