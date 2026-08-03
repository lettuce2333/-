'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card } from '@zuoye/ui';
import { toast } from '@/components/toaster';
import { Plus } from 'lucide-react';

interface CheckoutItem {
  skuId: number;
  quantity: number;
  productId?: number;
  productName?: string;
  price?: number;
  specs?: string;
}

interface Address {
  id: number;
  receiver: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: number | boolean;
}

const emptyAddrForm = { receiver: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false };

export default function CheckoutPage() {
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const [mode, setMode] = useState<'cart' | 'buy'>('cart');
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrForm, setAddrForm] = useState(emptyAddrForm);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<number | undefined>(undefined);
  const openedAt = useRef<string | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    openedAt.current = openedAt.current || new Date().toISOString();
    const searchMode = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('mode')
      : null;
    setMode(searchMode === 'buy' ? 'buy' : 'cart');

    const loadAddresses = () => api.get('/users/addresses').then((addrs: any) => {
      const list = Array.isArray(addrs) ? addrs : [];
      setAddresses(list);
      setSelectedAddr(list.find((a: any) => a.isDefault) || list[0] || null);
    });

    const loadItems = async () => {
      if (searchMode === 'buy') {
        const raw = typeof window !== 'undefined'
          ? JSON.parse(sessionStorage.getItem('buy_now_items') || '[]')
          : [];
        const enriched: CheckoutItem[] = [];
        for (const it of raw) {
          const p: any = await api.get(`/products/${it.productId}`);
          const sku = (p.skus || []).find((s: any) => s.id === it.skuId) || p.skus?.[0];
          if (sku) {
            enriched.push({
              productId: p.id,
              skuId: sku.id,
              quantity: it.quantity,
              productName: p.name,
              price: sku.price,
              specs: sku.specs,
            });
          }
        }
        setItems(enriched);
        return;
      }

      const cart: any = await api.get('/cart');
      const ids = typeof window !== 'undefined'
        ? new Set<number>(JSON.parse(sessionStorage.getItem('checkout_cart_ids') || '[]'))
        : new Set<number>();
      const data = Array.isArray(cart) ? cart.filter((i: any) => ids.size === 0 || ids.has(i.id)) : [];
      setItems(data.map((i: any) => ({
        productId: i.productId,
        skuId: i.skuId,
        quantity: i.quantity,
        productName: i.product?.name,
        price: i.sku?.price,
        specs: i.sku?.specs,
      })));
    };

    const loadCoupons = () => api.get('/tokens/coupons').then((cps: any) => {
      setCoupons(Array.isArray(cps) ? cps : []);
    }).catch(() => setCoupons([]));

    Promise.all([loadItems(), loadAddresses(), loadCoupons()])
      .catch((err: any) => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [user, router]);

  const total = items.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0);

  const addAddress = async () => {
    try {
      const created: any = await api.post('/users/addresses', addrForm);
      const list: any = await api.get('/users/addresses');
      const addrs = Array.isArray(list) ? list : [];
      setAddresses(addrs);
      setSelectedAddr(addrs.find((a: any) => a.id === created?.id) || created || addrs[0] || null);
      setShowAddrForm(false);
      setAddrForm(emptyAddrForm);
      toast('地址已添加', 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const submitOrder = async () => {
    if (!selectedAddr) { toast('请选择收货地址', 'error'); return; }
    if (items.length === 0) { toast('没有可结算的商品', 'error'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/orders', {
        addressId: selectedAddr.id,
        items: items.map((i) => ({ skuId: i.skuId, quantity: i.quantity })),
        createdAt: openedAt.current || undefined,
        fromCart: mode === 'cart',
        couponId: selectedCouponId,
      });
      const orderId = Array.isArray(res) ? res[0]?.id : res?.id;
      toast('订单创建成功', 'success');
      router.push(`/orders/${orderId}`);
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-8"><div className="h-48 animate-pulse rounded-lg bg-gray-200" /></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold">确认订单</h1>

      <Card className="mb-4">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <span className="font-medium">收货地址</span>
          <Button size="sm" variant="outline" onClick={() => setShowAddrForm(!showAddrForm)}>
            <Plus className="mr-1 h-4 w-4" />新增地址
          </Button>
        </div>
        <div className="px-6 py-4">
          {addresses.length === 0 && !showAddrForm ? (
            <p className="text-sm text-gray-400">暂无收货地址，请先新增地址</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {addresses.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => setSelectedAddr(addr)}
                  className={`rounded-lg border p-4 text-left text-sm transition-colors ${
                    selectedAddr?.id === addr.id
                      ? 'border-red-500 bg-red-50/40'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-800">
                    {addr.receiver} {addr.phone}
                    {addr.isDefault ? <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-500">默认</span> : null}
                  </p>
                  <p className="mt-1 text-gray-500">{addr.province}{addr.city}{addr.district} {addr.detail}</p>
                </button>
              ))}
            </div>
          )}

          {showAddrForm && (
            <div className="mt-4 rounded-lg border border-gray-200 p-4">
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="收货人" className="rounded-lg border px-3 py-2 text-sm" value={addrForm.receiver} onChange={(e) => setAddrForm({ ...addrForm, receiver: e.target.value })} />
                <input placeholder="手机号" className="rounded-lg border px-3 py-2 text-sm" value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <input placeholder="省" className="rounded-lg border px-3 py-2 text-sm" value={addrForm.province} onChange={(e) => setAddrForm({ ...addrForm, province: e.target.value })} />
                <input placeholder="市" className="rounded-lg border px-3 py-2 text-sm" value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} />
                <input placeholder="区" className="rounded-lg border px-3 py-2 text-sm" value={addrForm.district} onChange={(e) => setAddrForm({ ...addrForm, district: e.target.value })} />
              </div>
              <input placeholder="详细地址" className="mt-3 w-full rounded-lg border px-3 py-2 text-sm" value={addrForm.detail} onChange={(e) => setAddrForm({ ...addrForm, detail: e.target.value })} />
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={addrForm.isDefault} onChange={(e) => setAddrForm({ ...addrForm, isDefault: e.target.checked })} />
                设为默认地址
              </label>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={addAddress}>保存地址</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddrForm(false)}>取消</Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="mb-4">
        <div className="border-b border-gray-100 px-6 py-4 font-medium">商品信息</div>
        <div className="px-6 py-4">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 py-2">
              <div className="h-16 w-16 flex-shrink-0 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xl">📦</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.productName || '商品'}</p>
                <p className="text-xs text-gray-400">{item.specs || ''} x{item.quantity}</p>
              </div>
              <p className="text-sm font-bold text-red-500">￥{((item.price || 0) * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-4">
        <div className="border-b border-gray-100 px-6 py-4 font-medium">优惠券</div>
        <div className="px-6 py-4">
          {coupons.length === 0 ? (
            <p className="text-sm text-gray-400">暂无可用优惠券</p>
          ) : (
            <select
              value={selectedCouponId || ''}
              onChange={(e) => setSelectedCouponId(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">不使用优惠券</option>
              {coupons.map((c) => (
                <option key={c.id} value={c.id}>{c.title}（满{c.minSpend}元可用）</option>
              ))}
            </select>
          )}
        </div>
      </Card>

      <Card className="mb-6">
        <div className="px-6 py-4 text-right">
          <span className="text-sm text-gray-600">合计：</span>
          <span className="text-2xl font-bold text-red-500">￥{total.toFixed(2)}</span>
        </div>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.push(mode === 'buy' ? '/products' : '/cart')}>返回</Button>
        <Button onClick={submitOrder} loading={submitting}>提交订单</Button>
      </div>
    </div>
  );
}
