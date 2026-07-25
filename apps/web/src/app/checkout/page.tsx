'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card } from '@zuoye/ui';
import { toast } from '@/components/toaster';

export default function CheckoutPage() {
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    Promise.all([
      api.get('/cart'),
      api.get('/users/addresses'),
    ]).then(([cart, addrs]) => {
      setCartItems(Array.isArray(cart) ? cart : []);
      const addrList = Array.isArray(addrs) ? addrs : [];
      setAddresses(addrList);
      setSelectedAddr(addrList.find((a: any) => a.isDefault) || addrList[0]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, router]);

  const total = cartItems.reduce((sum, i) => sum + (i.sku?.price || 0) * i.quantity, 0);

  const submitOrder = async () => {
    if (!selectedAddr) { toast('请选择收货地址', 'error'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/orders', {
        addressId: selectedAddr.id,
        items: cartItems.map((i) => ({ skuId: i.skuId, quantity: i.quantity })),
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

      {/* Address */}
      <Card className="mb-4">
        <div className="border-b border-gray-100 px-6 py-4 font-medium">收货地址</div>
        <div className="px-6 py-4">
          {!selectedAddr ? (
            <p className="text-sm text-gray-400">请添加收货地址</p>
          ) : (
            <div className="text-sm">
              <p><span className="font-medium">{selectedAddr.receiver}</span> {selectedAddr.phone}</p>
              <p className="mt-1 text-gray-500">{selectedAddr.province}{selectedAddr.city}{selectedAddr.district} {selectedAddr.detail}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Items */}
      <Card className="mb-4">
        <div className="border-b border-gray-100 px-6 py-4 font-medium">商品信息</div>
        <div className="px-6 py-4">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center gap-4 py-2">
              <div className="h-16 w-16 flex-shrink-0 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xl">📦</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.product?.name}</p>
                <p className="text-xs text-gray-400">x{item.quantity}</p>
              </div>
              <p className="text-sm font-bold text-red-500">￥{(item.sku?.price || 0) * item.quantity}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Total */}
      <Card className="mb-6">
        <div className="px-6 py-4 text-right">
          <span className="text-sm text-gray-600">合计：</span>
          <span className="text-2xl font-bold text-red-500">￥{total.toFixed(2)}</span>
        </div>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.push('/cart')}>返回购物车</Button>
        <Button onClick={submitOrder} loading={submitting}>提交订单</Button>
      </div>
    </div>
  );
}
