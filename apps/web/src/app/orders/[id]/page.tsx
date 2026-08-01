'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, Badge } from '@zuoye/ui';
import { toast } from '@/components/toaster';
import { Star } from 'lucide-react';

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
  const [afterSale, setAfterSale] = useState<{ orderId: number; orderNo: string; amount: number; reason: string } | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.get(`/orders/${id}`).then((res) => { setOrder(res); setLoading(false); }).catch(() => setLoading(false));
  }, [id, user, router]);

  const submitReview = async () => {  if (!reviewForm.content?.trim()) { toast('请输入评价内容', 'error'); return; }  setSubmittingReview(true);  try {    await api.post('/reviews', { orderId: id, productId: order?.items?.[0]?.productId, rating: reviewForm.rating, content: reviewForm.content });    toast('评价成功', 'success');    setShowReview(false);  } catch (err: any) { toast(err.message, 'error'); } finally { setSubmittingReview(false); }};

const handlePay = async () => {
    try { await api.post(`/orders/${id}/pay`); toast('支付成功', 'success'); setOrder({ ...order, status: 'PAID' }); } catch (err: any) { toast(err.message, 'error'); }
  };

  const handleReceive = async () => {
    try { await api.post(`/orders/${id}/receive`); toast('已确认收货', 'success'); setOrder({ ...order, status: 'RECEIVED' }); } catch (err: any) { toast(err.message, 'error'); }
  };

  const handleAfterSale = async () => {
    if (!afterSale || !afterSale.reason) { toast('请填写申请原因', 'error'); return; }
    try {
      await api.post('/after-sales', { orderId: afterSale.orderId, type: 'refund_only', reason: afterSale.reason, amount: afterSale.amount });
      toast('售后申请已提交', 'success');
      setAfterSale(null);
    } catch (err: any) { toast(err.message, 'error'); }
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
          {(order.status === 'RECEIVED' || order.status === 'COMPLETED') && <button onClick={() => setShowReview(!showReview)} className="text-sm text-blue-600 hover:underline mr-3">评价</button>}
          {order.status === 'RECEIVED' && !(order.afterSales?.some((a: any) => !['REFUNDED','CLOSED','ADMIN_REJECT','SHOP_REFUSED'].includes(a.status))) && <Button variant="outline" onClick={() => setAfterSale({ orderId: order.id, orderNo: order.orderNo, amount: order.totalAmount, reason: '' })}>申请售后</Button>}
        </div>
      </div>

      {showReview && (
        <div className="mt-4 rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-medium">评价商品</h3>
          <div className="mb-3 flex items-center gap-1">
            {[1,2,3,4,5].map((s) => (
              <Star key={s}
                className={`h-6 w-6 cursor-pointer ${s <= reviewForm.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                onClick={() => setReviewForm({ ...reviewForm, rating: s })}
              />
            ))}
          </div>
          <textarea
            placeholder="分享您的使用体验..."
            className="w-full rounded-lg border px-3 py-2 text-sm"
            rows={3}
            value={reviewForm.content}
            onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowReview(false)}>取消</Button>
            <Button size="sm" onClick={submitReview} loading={submittingReview}>提交评价</Button>
          </div>
        </div>
      )}

      {/* After-Sale Dialog */}
      {afterSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg">
            <h3 className="text-lg font-bold mb-4">申请售后</h3>
            <p className="text-sm text-gray-500 mb-3">订单号：{afterSale.orderNo}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">退款金额</label>
                <input type="number" className="w-full rounded-lg border px-3 py-2" value={afterSale.amount} onChange={(e) => setAfterSale({ ...afterSale, amount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">申请原因</label>
                <textarea className="w-full rounded-lg border px-3 py-2" rows={3} value={afterSale.reason} onChange={(e) => setAfterSale({ ...afterSale, reason: e.target.value })} placeholder="请描述退款原因" />
              </div>
            </div>
            <div className="mt-5 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setAfterSale(null)}>取消</Button>
              <Button onClick={handleAfterSale}>提交申请</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
