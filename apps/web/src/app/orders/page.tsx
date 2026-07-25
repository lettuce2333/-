'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, Badge } from '@zuoye/ui';
import { toast } from '@/components/toaster';

const statusMap: Record<string, string> = {
  PENDING_PAYMENT: '待付款', PAID: '已付款', SHIPPED: '已发货',
  DELIVERED: '已送达', RECEIVED: '已收货', COMPLETED: '已完成',
  CANCELLED: '已取消', REFUNDED: '已退款',
};

const statusColors: Record<string, string> = {
  PENDING_PAYMENT: 'warning', PAID: 'info', SHIPPED: 'info',
  RECEIVED: 'success', COMPLETED: 'success', CANCELLED: 'default', REFUNDED: 'default',
};

export default function OrdersPage() {
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    const params = statusFilter ? `?status=${statusFilter}` : '';
    api.get(`/orders${params}`).then((res) => {
      setOrders(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, router, statusFilter]);

  const handlePay = async (id: number) => {
    try {
      await api.post(`/orders/${id}/pay`);
      toast('支付成功', 'success');
      setOrders(orders.map((o) => o.id === id ? { ...o, status: 'PAID' } : o));
    } catch (err: any) { toast(err.message, 'error'); }
  };

  const handleReceive = async (id: number) => {
    try {
      await api.post(`/orders/${id}/receive`);
      toast('已确认收货', 'success');
      setOrders(orders.map((o) => o.id === id ? { ...o, status: 'RECEIVED' } : o));
    } catch (err: any) { toast(err.message, 'error'); }
  };

  const handleCancel = async (id: number) => {
    try {
      await api.post(`/orders/${id}/cancel`, { reason: '用户取消' });
      toast('已取消', 'success');
      setOrders(orders.map((o) => o.id === id ? { ...o, status: 'CANCELLED' } : o));
    } catch (err: any) { toast(err.message, 'error'); }
  };

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-8"><div className="h-48 animate-pulse rounded-lg bg-gray-200" /></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold">我的订单</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        {['', 'PENDING_PAYMENT', 'PAID', 'SHIPPED', 'RECEIVED', 'COMPLETED', 'CANCELLED'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-sm ${statusFilter === s ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s ? statusMap[s] : '全部'}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <p className="text-4xl mb-2">📋</p>
          <p>暂无订单</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-3">
                <span className="text-xs text-gray-400">{order.orderNo}</span>
                <Badge variant={(statusColors[order.status] || 'default') as any}>{statusMap[order.status] || order.status}</Badge>
              </div>
              <div className="px-6 py-3">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 py-2">
                    <div className="h-14 w-14 flex-shrink-0 rounded bg-gray-100 flex items-center justify-center text-gray-300">📦</div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.productId}`} className="text-sm font-medium text-gray-800 hover:text-red-500 line-clamp-1">
                        {item.productName}
                      </Link>
                      <p className="text-xs text-gray-400">￥{item.unitPrice} x {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-red-500">￥{item.subtotal}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
                <span className="text-sm">共 {order.items?.length || 0} 件 合计：<span className="font-bold text-red-500">￥{order.totalAmount}</span></span>
                <div className="flex gap-2">
                  <Link href={`/orders/${order.id}`}><Button variant="outline" size="sm">查看详情</Button></Link>
                  {order.status === 'PENDING_PAYMENT' && (
                    <><Button size="sm" onClick={() => handlePay(order.id)}>去支付</Button><Button variant="ghost" size="sm" onClick={() => handleCancel(order.id)}>取消</Button></>
                  )}
                  {order.status === 'SHIPPED' && <Button size="sm" onClick={() => handleReceive(order.id)}>确认收货</Button>}
                  {order.status === 'RECEIVED' && <Link href={`/after-sales?orderId=${order.id}`}><Button variant="outline" size="sm">申请售后</Button></Link>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
