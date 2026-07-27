'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card, Input } from '@zuoye/ui';
import { toast } from '@/components/toaster';
import { MerchantLayout } from '@/components/merchant-layout';

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', categoryId: 1, description: '', price: '', totalStock: '' });
  const [skus, setSkus] = useState([{ specs: '{}', price: '', stock: '' }]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
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

  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const addSku = () => setSkus([...skus, { specs: '{}', price: '', stock: '' }]);
  const updateSku = (i: number, field: string, val: string) => {
    const next = [...skus]; next[i] = { ...next[i], [field]: val }; setSkus(next);
  };

 const handleSubmit = async () => {
    if (!form.name) { toast('请输入商品名称', 'error'); return; }
    // Validate SKU specs JSON
    for (let i = 0; i < skus.length; i++) {
      try {
        JSON.parse(skus[i].specs || '{}');
      } catch {
        toast(`第 ${i + 1} 个 SKU 的规格格式不正确，请填写合法的 JSON，如 {"颜色":"红"}`, 'error');
        return;
      }
    }
    setSubmitting(true);
    try {
      await api.post('/merchant/products', {
        name: form.name,
        categoryId: parseInt(form.categoryId as any),
        description: form.description,
        images: images,
        skus: skus.map((s) => ({
          specs: JSON.parse(s.specs || '{}'),
          price: parseFloat(s.price) || 0,
          stock: parseInt(s.stock) || 0,
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
            <label className="block text-sm font-medium text-[var(--color-ink)]">类目ID</label>
            <input type="number" className="mt-1 block w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: parseInt(e.target.value) })} />
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
                {uploading ? (
                  <span className="text-xs animate-pulse">上传中...</span>
                ) : (
                  <><span className="text-2xl">+</span><span className="mt-1 text-xs">上传图片</span></>
                )}
                <input type="file" accept="image/*" onChange={uploadImage} className="hidden" />
              </label>
            </div>
          </div>
          <div className="border-t border-[var(--color-border-light)] pt-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-ink)]">SKU</span>
              <Button size="sm" variant="outline" onClick={addSku}>添加SKU</Button>
            </div>
            {skus.map((sku, i) => (
              <div key={i} className="mb-2 flex gap-2">
                <input placeholder='规格JSON' className="flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm" value={sku.specs} onChange={(e) => updateSku(i, 'specs', e.target.value)} />
                <input placeholder="价格" type="number" className="w-24 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm" value={sku.price} onChange={(e) => updateSku(i, 'price', e.target.value)} />
                <input placeholder="库存" type="number" className="w-24 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm" value={sku.stock} onChange={(e) => updateSku(i, 'stock', e.target.value)} />
              </div>
            ))}
          </div>
          <Button onClick={handleSubmit} loading={submitting}>保存商品</Button>
        </Card>
      </div>
    </MerchantLayout>
  );
}
