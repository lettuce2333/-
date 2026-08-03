'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, Badge } from '@zuoye/ui';
import { toast } from '@/components/toaster';

export default function TokenRedeemPage() {
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [couponAmount, setCouponAmount] = useState(1);
  const [selSku, setSelSku] = useState<Record<number, number>>({});
  const [selQty, setSelQty] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState(false);

  const load = () => {
    Promise.all([
      api.get('/tokens/me'),
      api.get('/tokens/coupons'),
      api.get('/tokens/redeem/products'),
      api.get('/tokens/redemptions'),
    ]).then(([me, cps, pds, rds]) => {
      setBalance(me?.balance || 0);
      setCoupons(cps || []);
      setProducts(pds || []);
      setRedemptions(rds || []);
    }).catch(() => {});
  };

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    load();
  }, [user, router]);

  const redeemCoupon = async () => {
    setBusy(true);
    try {
      await api.post('/tokens/redeem/coupon', { amount: couponAmount });
      toast('兑换成功', 'success');
      load();
    } catch (err: any) { toast(err.message, 'error'); }
    finally { setBusy(false); }
  };

  const redeemProduct = async (product: any) => {
    const skuId = selSku[product.id] || product.skus?.[0]?.id;
    const qty = selQty[product.id] || 1;
    if (!skuId) { toast('请选择规格', 'error'); return; }
    setBusy(true);
    try {
      await api.post('/tokens/redeem/product', { skuId, quantity: qty });
      toast('兑换成功', 'success');
      load();
    } catch (err: any) { toast(err.message, 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold">兑换中心</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">可用法庭币：<span className="font-bold text-[var(--color-accent)]">{balance}</span> · 100 币 = 1 元</p>
      </div>

      <Card className="mb-4">
        <div className="border-b border-gray-100 px-6 py-4 font-medium">兑换优惠券</div>
        <div className="px-6 py-4 flex flex-wrap items-center gap-3">
          <select value={couponAmount} onChange={(e) => setCouponAmount(parseInt(e.target.value))} className="rounded border border-gray-200 px-3 py-2 text-sm">
            {[1, 5, 10, 20].map((v) => <option key={v} value={v}>{v}元券（{v * 100}币）</option>)}
          </select>
          <Button onClick={redeemCoupon} loading={busy} disabled={couponAmount * 100 > balance}>立即兑换</Button>
          <div className="w-full">
            <p className="mb-1 text-xs text-[var(--color-muted)]">我的优惠券（下单时可抵扣）</p>
            <div className="flex flex-wrap gap-2">
              {coupons.length === 0 ? <span className="text-xs text-gray-400">暂无可用优惠券</span> : coupons.map((c) => (
                <Badge key={c.id} variant="success">{c.title}</Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <div className="border-b border-gray-100 px-6 py-4 font-medium">兑换商品</div>
        <div className="px-6 py-4">
          {products.length === 0 ? (
            <p className="text-sm text-gray-400">暂无可兑换商品</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {products.map((p) => {
                const skuId = selSku[p.id] || p.skus?.[0]?.id;
                const sku = p.skus?.find((s: any) => s.id === skuId);
                return (
                  <div key={p.id} className="rounded-lg border border-gray-100 p-4">
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">兑换价：{p.tokenPrice} 币/件 · 库存 {sku?.stock ?? 0}</p>
                    <div className="mt-2 flex gap-2">
                      <select value={skuId} onChange={(e) => setSelSku({ ...selSku, [p.id]: parseInt(e.target.value) })} className="flex-1 rounded border border-gray-200 px-2 py-1.5 text-xs">
                        {p.skus?.map((s: any) => <option key={s.id} value={s.id}>{s.specs || '默认规格'}（{s.stock}）</option>)}
                      </select>
                      <input type="number" min={1} value={selQty[p.id] || 1} onChange={(e) => setSelQty({ ...selQty, [p.id]: parseInt(e.target.value) || 1 })} className="w-16 rounded border border-gray-200 px-2 py-1.5 text-xs" />
                    </div>
                    <Button size="sm" className="mt-3" onClick={() => redeemProduct(p)} loading={busy} disabled={(p.tokenPrice * (selQty[p.id] || 1)) > balance}>兑换</Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="border-b border-gray-100 px-6 py-4 font-medium">兑换记录</div>
        <div className="px-6 py-4">
          {redemptions.length === 0 ? (
            <p className="text-sm text-gray-400">暂无兑换记录</p>
          ) : (
            <div className="space-y-2">
              {redemptions.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded bg-gray-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-mono text-xs text-gray-400">{r.orderNo}</p>
                    <p className="text-xs">{r.items?.map((i: any) => `${i.productName} x${i.quantity}`).join('、')}</p>
                  </div>
                  <span className="font-bold text-red-500">-{r.totalTokens} 币</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
