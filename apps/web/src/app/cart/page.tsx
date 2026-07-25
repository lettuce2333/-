'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card } from '@zuoye/ui';
import { toast } from '@/components/toaster';
import { Trash2 } from 'lucide-react';

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

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-8"><div className="h-48 animate-pulse rounded-lg bg-gray-200" /></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold">购物车</h1>
      {items.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <p className="text-4xl mb-4">🛒</p>
          <p>购物车是空的</p>
          <Link href="/products" className="mt-2 inline-block text-red-500 hover:underline">去逛逛</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="flex items-center gap-4">
              <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} className="ml-4 h-5 w-5 accent-red-500" />
              <div className="h-20 w-20 flex-shrink-0 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-2xl">📦</div>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.productId}`} className="text-sm font-medium text-gray-800 hover:text-red-500 line-clamp-1">
                  {item.product?.name}
                </Link>
                <p className="mt-1 text-xs text-gray-400">{item.sku?.specs ? Object.values(JSON.parse(item.sku.specs)).join(' / ') : ''}</p>
                <p className="mt-1 text-sm font-bold text-red-500">￥{item.sku?.price || 0}</p>
              </div>
              <div className="flex items-center border rounded-lg">
                <button onClick={() => updateQty(item.id, item.quantity - 1)} className="px-2 py-1 text-gray-500 hover:bg-gray-100">-</button>
                <span className="min-w-[2.5rem] text-center text-sm">{item.quantity}</span>
                <button onClick={() => updateQty(item.id, item.quantity + 1)} className="px-2 py-1 text-gray-500 hover:bg-gray-100">+</button>
              </div>
              <button onClick={() => removeItem(item.id)} className="mr-4 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </Card>
          ))}
          <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
            <div>
              <span className="text-sm text-gray-600">已选 {selected.size} 件</span>
              <span className="ml-4 text-lg font-bold text-red-500">合计：￥{total.toFixed(2)}</span>
            </div>
            <Button onClick={() => selected.size > 0 && router.push('/checkout')} disabled={selected.size === 0}>
              结算
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
