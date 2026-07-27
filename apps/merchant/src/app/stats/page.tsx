'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card } from '@zuoye/ui';
import { ShoppingCart, DollarSign, Package, TrendingUp } from 'lucide-react';
import { MerchantLayout } from '@/components/merchant-layout';

export default function StatsPage() {
  const router = useRouter();
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ orders: 0, products: 0, revenue: 0, afterSales: 0 });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    api.get('/merchant/shop').then((res) => {
      setShop(res);
      if (res?.id) {
        Promise.all([
          api.get('/merchant/orders?pageSize=1').then((r: any) => r.total || 0),
          api.get('/merchant/products').then((r: any) => r.total || 0),
          api.get('/merchant/after-sales').then((r: any) => r.total || 0),
        ]).then(([orders, products, afterSales]) => {
          setStats({ orders, products, afterSales, revenue: 0 });
          setLoading(false);
        });
      } else { setLoading(false); }
    }).catch(() => setLoading(false));
  }, [router]);

  if (loading) return <MerchantLayout title="数据统计"><div className="p-6"><div className="h-48 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-2)]" /></div></MerchantLayout>;
  if (!shop) return <MerchantLayout title="数据统计"><div className="p-6 py-20 text-center text-[var(--color-muted)]">暂无店铺</div></MerchantLayout>;

  const cards = [
    { label: '订单总数', value: stats.orders, icon: ShoppingCart, color: 'text-[var(--color-info)]' },
    { label: '商品总数', value: stats.products, icon: Package },
    { label: '售后待处理', value: stats.afterSales, icon: TrendingUp, color: 'text-[var(--color-warning)]' },
    { label: '销售额', value: '¥' + stats.revenue, icon: DollarSign, color: 'text-[var(--color-accent)]' },
  ];

  return (
    <MerchantLayout title="数据统计">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <Card key={c.label} accent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-surface-2)]">
                  <c.icon className={`h-6 w-6 ${c.color || 'text-[var(--color-muted)]'}`} />
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">{c.label}</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--color-ink)]">{c.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <Card className="mt-6 p-6">
          <h2 className="mb-4 font-medium text-[var(--color-ink)]">店铺信息</h2>
          <div className="space-y-2 text-sm text-[var(--color-muted)]">
            <p>名称：<span className="text-[var(--color-ink)]">{shop.name}</span></p>
            <p>描述：{shop.description || '-'}</p>
            <p>联系电话：{shop.contactPhone || '-'}</p>
            <p>状态：{shop.status === 'active' ? '营业中' : shop.status === 'pending' ? '审核中' : shop.status}</p>
            <p>创建时间：{new Date(shop.createdAt).toLocaleString()}</p>
          </div>
        </Card>
      </div>
    </MerchantLayout>
  );
}
