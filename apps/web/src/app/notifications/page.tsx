'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, Badge } from '@zuoye/ui';
import { Bell, CheckCheck, ChevronRight } from 'lucide-react';
import { toast } from '@/components/toaster';

const typeLabels: Record<string, string> = {
  order: '订单通知',
  after_sale: '售后通知',
  system: '系统通知',
};

export default function NotificationsPage() {
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.get('/notifications').then((res) => {
      setItems(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, router]);

  const markRead = async (id: number) => {
    await api.post(`/notifications/${id}/read`);
    setItems(items.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await api.post('/notifications/read-all');
    setItems(items.map((n) => ({ ...n, isRead: true })));
    toast('已全部标为已读', 'success');
  };

  const unreadCount = items.filter((n) => !n.isRead).length;

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-8"><div className="h-32 animate-pulse rounded-lg bg-gray-200" /></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">消息通知</h1>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={markAllRead}>
            <CheckCheck className="mr-1 h-4 w-4" />
            全部已读
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <Bell className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2">暂无通知</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Card key={n.id} className={`px-6 py-4 flex items-center gap-4 ${!n.isRead ? 'border-l-4 border-l-red-500 bg-red-50/30' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{typeLabels[n.type] || n.type}</span>
                  {!n.isRead && <span className="h-2 w-2 rounded-full bg-red-500" />}
                </div>
                <p className="mt-1 text-sm font-medium text-gray-800">{n.title}</p>
                {n.content && <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{n.content}</p>}
                <p className="mt-1 text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!n.isRead && (
                  <button onClick={() => markRead(n.id)} className="text-xs text-blue-500 hover:underline">标为已读</button>
                )}
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}