'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, Button } from '@zuoye/ui';
import { toast } from '@/components/toaster';
import { Heart } from 'lucide-react';

export default function FavoritesPage() {
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.get('/favorites').then((res) => {
      setItems(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, router]);

  const removeFavorite = async (productId: number) => {
    try {
      await api.post(\`/favorites/${productId}/toggle\`);
      setItems(items.filter((i) => i.productId !== productId));
      toast('已取消收藏', 'success');
    } catch (err: any) { toast(err.message, 'error'); }
  };

  const getImages = (p: any) => {
    try { const arr = JSON.parse(p?.images || '[]'); return Array.isArray(arr) ? arr : []; } catch { return []; }
  };

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-8"><div className="h-32 animate-pulse rounded-lg bg-gray-200" /></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold">我的收藏</h1>
      {items.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <Heart className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2">暂无收藏</p>
          <Link href="/products" className="mt-2 inline-block text-sm text-red-500 hover:underline">去逛逛</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {items.map((item: any) => {
            const images = getImages(item.product);
            return (
              <Card key={item.id} className="overflow-hidden">
                <Link href={\`/products/${item.productId}\`}>
                  <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                    {images.length > 0 ? (
                      <img src={images[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-gray-300 text-4xl">📦</span>
                    )}
                  </div>
                </Link>
                <div className="p-3">
                  <Link href={\`/products/${item.productId}\`} className="text-sm font-medium text-gray-800 line-clamp-1 hover:text-red-500">
                    {item.product?.name}
                  </Link>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg font-bold text-red-500">¥{item.product?.price}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeFavorite(item.productId)} className="text-gray-400 hover:text-red-500">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}