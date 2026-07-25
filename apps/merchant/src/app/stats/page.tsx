'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card } from '@zuoye/ui';
import { BarChart3, ShoppingCart, DollarSign, Package, TrendingUp, Users } from 'lucide-react';

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

  if (loading) return <div className="p-6"><div className="h-48 animate-pulse rounded-lg bg-gray-200" /></div>;
  if (!shop) return <div className="p-6 py-20 text-center text-gray-400">暂无店铺</div>;

  const cards = [
    { label: '订单总数', value: stats.orders, icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: '商品总数', value: stats.products, icon: Package, color: 'text-green-500', bg: 'bg-green-50' },
    { label: '售后待处理', value: stats.afterSales, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: '销售额', value: '¥' + stats.revenue, icon: DollarSign, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  return (
    <div className="p-6">
      <h1 className="mb-6 text-lg font-bold">数据统计</h1>
      <div className="grid grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-6">
            <div className="flex items-center gap-4">
              <div className={\`flex h-12 w-12 items-center justify-center rounded-lg ${c.bg}\`}>
                <c.icon className={\`h-6 w-6 ${c.color}\`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{c.label}</p>
                <p className="mt-1 text-2xl font-bold">{c.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Card className="mt-6 p-6">
        <h2 className="mb-4 font-medium">店铺信息</h2>
        <div className="space-y-2 text-sm">
          <p>名称：{shop.name}</p>
          <p>描述：{shop.description || '-'}</p>
          <p>联系电话：{shop.contactPhone || '-'}</p>
          <p>状态：{shop.status === 'active' ? '营业中' : shop.status === 'pending' ? '审核中' : shop.status}</p>
          <p>创建时间：{new Date(shop.createdAt).toLocaleString()}</p>
        </div>
      </Card>
    </div>
  );
}