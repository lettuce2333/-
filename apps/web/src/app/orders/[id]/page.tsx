'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, Badge } from '@zuoye/ui';
import { toast } from '@/components/toaster';

const statusMap: Record<string, string> = {
  PENDING_PAYMENT: '待付款', PAID: '已付款', SHIPPED: '已发货',
  DELIVERED: '已送达', RECEIVED: '已收货', COMPLETED: '已完成',
  CANCELLED: '已取消', REFUNDED: '已退款',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.get(`/orders/${id}`).then((res) => { setOrder(res); setLoading(false); }).catch(() => setLoading(false));
  }, [id, user, router]);

  const handlePay = async () => {
    try { await api.post(`/orders/${id}/pay`); toast('支付成功', 'success'); setOrder({ ...order, status: 'PAID' }); } catch (err: any) { toast(err.message, 'error'); }
  };

  const handleReceive = async () => {
    try { await api.post(`/orders/${id}/receive`); toast('已确认收货', 'success'); setOrder({ ...order, status: 'RECEIVED' }); } catch (err: any) { toast(err.message, 'error'); }
  };

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-8"><div className="h-48 animate-pulse rounded-lg bg-gray-200" /></div>;
  if (!order) return <div className="py-20 text-center text-gray-400">订单不存在</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">订单详情</h1>
        <Badge variant={order.status === 'COMPLETED' || order.status === 'RECEIVED' ? 'success' : order.status === 'CANCELLED' ? 'default' : 'warning'}>
          {statusMap[order.status] || order.status}
        </Badge>
      </div>

      <Card className="mb-4">
        <div className="border-b border-gray-100 px-6 py-4 font-medium">收货信息</div>
        <div className="px-6 py-4 text-sm">
          <p><span className="font-medium">{order.receiverName}</span> {order.receiverPhone}</p>
          <p className="mt-1 text-gray-500">{order.receiverAddress}</p>
        </div>
      </Card>

      <Card className="mb-4">
        <div className="border-b border-gray-100 px-6 py-4 font-medium">商品信息</div>
        <div className="px-6 py-4">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex items-center gap-4 py-2">
              <div className="h-16 w-16 flex-shrink-0 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xl">📦</div>
              <div className="flex-1">
                <Link href={`/products/${item.productId}`} className="text-sm font-medium text-gray-800 hover:text-red-500">{item.productName}</Link>
                <p className="text-xs text-gray-400">￥{item.unitPrice} x {item.quantity}</p>
              </div>
              <p className="text-sm font-bold text-red-500">￥{item.subtotal}</p>
            </div>
          ))}
        </div>
      </Card>

      {order.logistics && (
        <Card className="mb-4">
          <div className="border-b border-gray-100 px-6 py-4 font-medium">物流信息</div>
          <div className="px-6 py-4 text-sm">
            <p>快递公司：{order.logistics.company}</p>
            <p>运单号：{order.logistics.trackingNo}</p>
          </div>
        </Card>
      )}

      <Card className="mb-4">
        <div className="border-b border-gray-100 px-6 py-4 font-medium">订单信息</div>
        <div className="px-6 py-4 text-sm text-gray-500 space-y-1">
          <p>订单编号：{order.orderNo}</p>
          <p>下单时间：{new Date(order.createdAt).toLocaleString()}</p>
          {order.paidAt && <p>付款时间：{new Date(order.paidAt).toLocaleString()}</p>}
          {order.shippedAt && <p>发货时间：{new Date(order.shippedAt).toLocaleString()}</p>}
        </div>
      </Card>

      <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
        <span className="text-lg font-bold text-red-500">合计：￥{order.totalAmount}</span>
        <div className="flex gap-2">
          {order.status === 'PENDING_PAYMENT' && <Button onClick={handlePay}>去支付</Button>}
          {order.status === 'SHIPPED' && <Button onClick={handleReceive}>确认收货</Button>}
          {order.status === 'RECEIVED' && <Link href={`/after-sales/new?orderId=${order.id}`}><Button variant="outline">申请售后</Button></Link>}
        </div>
      </div>
    </div>
  );
}
