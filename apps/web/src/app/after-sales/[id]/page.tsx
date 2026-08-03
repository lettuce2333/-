'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, Badge } from '@zuoye/ui';
import { toast } from '@/components/toaster';

export default function AfterSaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const [as, setAs] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!user) { router.push('/login'); return; }
    api.get(`/after-sales/${id}`).then((res) => { setAs(res); setLoading(false); }).catch(() => setLoading(false));
  }, [id, user, router]);

  const actionLabels: Record<string, string> = {
    apply: '提交申请', approve: '商家同意', refuse: '商家拒绝',
    ship: '用户寄回', receive: '商家收货', arbitrate: '申诉', resolve: '处理完成',
  };
  const statusLabels: Record<string, string> = {
    PENDING: '待商家审核', SHOP_APPROVED: '商家已同意', SHOP_REFUSED: '商家已拒绝',
    AUTO_APPROVED: '系统自动同意', WAITING_RETURN: '等待寄回', BUYER_SHIPPED: '已寄回',
    SHOP_RECEIVED: '商家已收货', REFUNDED: '已退款', DISPUTE: '申诉中',
    ADMIN_REFUND: '管理员判定退款', ADMIN_REJECT: '管理员驳回', CLOSED: '已关闭',
    COURT_JUDGING: '小法庭投票中', COURT_ADMIN_REVIEW: '小法庭复核中',
  };

  const handleDispute = async () => {
    try { await api.post(`/after-sales/${id}/dispute`); toast('申诉已提交', 'success'); window.location.reload(); } catch (err: any) { toast(err.message, 'error'); }
  };

  const handleOpenCourt = async () => {
    try { await api.post(`/after-sales/${id}/court-open`); toast('小法庭已开启', 'success'); window.location.reload(); } catch (err: any) { toast(err.message, 'error'); }
  };

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-8"><div className="h-48 animate-pulse rounded-lg bg-gray-200" /></div>;
  if (!as) return <div className="py-20 text-center text-gray-400">售后记录不存在</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">售后详情</h1>
        <Badge variant={as.status === 'REFUNDED' ? 'success' : as.status === 'PENDING' ? 'warning' : as.status === 'DISPUTE' ? 'danger' : 'info'}>
          {statusLabels[as.status] || as.status}
        </Badge>
      </div>

      <Card className="mb-4">
        <div className="border-b border-gray-100 px-6 py-4 font-medium">售后信息</div>
        <div className="px-6 py-4 text-sm space-y-2">
          <p>类型：{as.type === 'refund_only' ? '仅退款' : '退货退款'}</p>
          <p>原因：{as.reason}</p>
          <p>金额：<span className="font-bold text-red-500">￥{as.amount}</span></p>
          <p>订单号：{as.order?.orderNo}</p>
          <p>申请时间：{new Date(as.appliedAt).toLocaleString()}</p>
        </div>
      </Card>

      <Card className="mb-4">
        <div className="border-b border-gray-100 px-6 py-4 font-medium">处理记录</div>
        <div className="px-6 py-4">
          {as.logs?.length === 0 ? <p className="text-sm text-gray-400">暂无记录</p> : (
            <div className="space-y-3">
              {as.logs?.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 text-sm">
                  <div className="mt-1 h-2 w-2 rounded-full bg-red-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-700">{actionLabels[log.action] || log.action}</p>
                    <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
                    {log.remark && <p className="mt-1 text-gray-500">{log.remark}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {as.status === 'SHOP_REFUSED' && (
        <div className="flex gap-3">
          <Button variant="danger" onClick={handleDispute}>申诉</Button>
          <Button onClick={handleOpenCourt}>开启小法庭</Button>
        </div>
      )}
      {(as.status === 'COURT_JUDGING' || as.status === 'COURT_ADMIN_REVIEW') && as.courtCase && (
        <Link href={`/court/${as.courtCase.id}`} className="inline-block"><Button>查看小法庭案件</Button></Link>
      )}
    </div>
  );
}
