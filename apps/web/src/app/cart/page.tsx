'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card } from '@zuoye/ui';
import { toast } from '@/components/toaster';
import { Trash2, Minus, Plus } from 'lucide-react';

export default function CartPage() {
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.get('/cart').then((res) => {
      const data = Array.isArray(res) ? res : [];
      setItems(data);
      setSelected(new Set(data.map((i: any) => i.id)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, router]);

  const toggleSelect = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const updateQty = async (id: number, qty: number) => {
    if (qty < 1) return;
    await api.put(`/cart/${id}`, { quantity: qty });
    setItems(items.map((i) => i.id === id ? { ...i, quantity: qty } : i));
  };

  const removeItem = async (id: number) => {
    await api.delete(`/cart/${id}`);
    setItems(items.filter((i) => i.id !== id));
    const next = new Set(selected);
    next.delete(id);
    setSelected(next);
    toast('已删除', 'success');
  };

  const total = items.filter((i) => selected.has(i.id))
    .reduce((sum, i) => sum + (i.sku?.price || 0) * i.quantity, 0);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-8"><div className="h-48 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-2)]" /></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-[var(--color-ink)]">购物车</h1>
        <span className="text-sm text-[var(--color-muted)]">{items.length} 件商品</span>
      </div>
      {items.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-5xl mb-4 opacity-30">🛒</p>
          <p className="text-[var(--color-muted)] mb-3">购物车是空的</p>
          <Link href="/products" className="inline-block text-sm text-[var(--color-accent)] hover:underline font-medium">去逛逛</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="flex items-center gap-4 px-5 py-4">
              <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} className="h-5 w-5 accent-[var(--color-accent)]" />
              <div className="h-20 w-20 flex-shrink-0 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)]/40 text-2xl overflow-hidden">
                📦
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.productId}`} className="text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-accent)] transition-colors line-clamp-1">
                  {item.product?.name}
                </Link>
                <p className="mt-1 text-xs text-[var(--color-muted)]">{item.sku?.specs || ''}</p>
                <p className="mt-1.5 text-sm font-bold text-[var(--color-accent)]">&yen;{item.sku?.price || 0}</p>
              </div>
              <div className="flex items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] overflow-hidden">
                <button onClick={() => updateQty(item.id, item.quantity - 1)} className="px-2.5 py-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] transition-colors"><Minus className="h-3 w-3" /></button>
                <span className="min-w-[2.5rem] text-center text-sm font-medium text-[var(--color-ink)]">{item.quantity}</span>
                <button onClick={() => updateQty(item.id, item.quantity + 1)} className="px-2.5 py-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] transition-colors"><Plus className="h-3 w-3" /></button>
              </div>
              <button onClick={() => removeItem(item.id)} className="text-[var(--color-muted)] hover:text-[var(--color-danger)] transition-colors p-1">
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
          <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border-light)] p-5 shadow-[var(--shadow-card)]">
            <div>
              <span className="text-sm text-[var(--color-muted)]">已选 <span className="font-medium text-[var(--color-ink)]">{selected.size}</span> 件</span>
              <span className="ml-4 text-lg font-bold text-[var(--color-accent)]">合计：&yen;{total.toFixed(2)}</span>
            </div>
            <Button size="lg" onClick={() => selected.size > 0 && router.push('/checkout')} disabled={selected.size === 0}>
              去结算
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
