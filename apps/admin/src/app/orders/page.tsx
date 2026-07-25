'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, Badge } from '@zuoye/ui';

const sm: Record<string, string> = {
  PENDING_PAYMENT: '待付款', PAID: '已付款', SHIPPED: '已发货',
  DELIVERED: '已送达', RECEIVED: '已收货', COMPLETED: '已完成',
  CANCELLED: '已取消', REFUNDED: '已退款',
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    api.get('/admin/orders').then(() => { setOrders([]); setLoading(false); }).catch(() => setLoading(false));
    // Note: admin orders need additional API - using merchant endpoint for now
    api.get('/merchant/orders').then((res) => { setOrders(res.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, [router, filter]);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-bold">订单监管</h1>
      {loading ? <div className="h-32 animate-pulse rounded-lg bg-gray-200" /> : orders.length === 0 ? (
        <div className="py-20 text-center text-gray-400">暂无订单</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id} className="px-6 py-4">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{order.orderNo}</p>
                  <p className="text-xs text-gray-400">金额：￥{order.totalAmount} | {new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <Badge variant={order.status === 'COMPLETED' ? 'success' : order.status === 'PENDING_PAYMENT' ? 'warning' : 'info'}>
                  {sm[order.status] || order.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
