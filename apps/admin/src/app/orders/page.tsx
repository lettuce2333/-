'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, Badge } from '@zuoye/ui';

const sm: Record<string, string> = {
  PENDING_PAYMENT: '待付款', PAID: '已付款', SHIPPED: '已发货',
  RECEIVED: '已收货', COMPLETED: '已完成', CANCELLED: '已取消', REFUNDED: '已退款',
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    const params = new URLSearchParams({ page: String(page), pageSize: '10' });
    if (filter) params.set('status', filter);
    api.get(\`/admin/orders?${params}\`).then((res: any) => {
      setOrders(res.data || []); setTotal(res.total || 0); setLoading(false);
    }).catch(() => setLoading(false));
  }, [router, filter, page]);

  const pageCount = Math.ceil(total / 10);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-bold">订单监管</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        {['', 'PENDING_PAYMENT', 'PAID', 'SHIPPED', 'RECEIVED', 'COMPLETED', 'CANCELLED'].map((s) => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }}
            className={\`rounded-full px-3 py-1 text-sm ${filter === s ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}\`}>
            {s ? sm[s] : '全部'}
          </button>
        ))}
      </div>
      {loading ? <div className="h-48 animate-pulse rounded-lg bg-gray-200" /> : orders.length === 0 ? (
        <div className="py-20 text-center text-gray-400">暂无订单</div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.id} className="px-6 py-4">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{order.orderNo}</p>
                    <p className="text-xs text-gray-400">用户: {order.user?.nickname || order.user?.email} | 店铺: {order.shop?.name} | 金额: ¥{order.totalAmount}</p>
                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <Badge variant={order.status === 'COMPLETED' ? 'success' : order.status === 'PENDING_PAYMENT' ? 'warning' : order.status === 'CANCELLED' ? 'default' : 'info'}>
                    {sm[order.status] || order.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50">上一页</button>
              <span className="text-sm text-gray-500">第 {page}/{pageCount} 页 (共 {total} 条)</span>
              <button disabled={page >= pageCount} onClick={() => setPage(page + 1)} className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50">下一页</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}