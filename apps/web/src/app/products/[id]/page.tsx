'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card } from '@zuoye/ui';
import { toast } from '@/components/toaster';
import { ShoppingCart, Star } from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSku, setSelectedSku] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    api.get(`/products/${id}`).then((res) => {
      setProduct(res);
      if (res.skus?.length > 0) setSelectedSku(res.skus[0]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const productImages = (() => {
    try { const arr = JSON.parse(product?.images || "[]"); return Array.isArray(arr) ? arr : []; } catch { return []; }
  })();

  const addToCart = async () => {
    if (!user) { router.push('/login'); return; }
    if (!selectedSku) return;
    try {
      await api.post('/cart', { productId: parseInt(id), skuId: selectedSku.id, quantity: qty });
      toast('已加入购物车', 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const buyNow = async () => {
    if (!user) { router.push('/login'); return; }
    addToCart();
    router.push('/cart');
  };

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-8"><div className="h-96 animate-pulse rounded-lg bg-gray-200" /></div>;
  if (!product) return <div className="py-20 text-center text-gray-400">商品不存在</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid grid-cols-2 gap-8">
        {/* Image gallery */}
        <div>
          <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
            {productImages.length > 0 ? (
              <img src={productImages[currentImage]} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-gray-300 text-8xl">📦</span>
            )}
          </div>
          {productImages.length > 1 && (
            <div className="mt-3 flex gap-2">
              {productImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                    currentImage === i ? "border-red-500" : "border-transparent"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-400 fill-yellow-400" /> {product.reviews?.length || 0} 条评价</span>
            <span>已售 {product.sales}</span>
          </div>

          <div className="mt-4 rounded-lg bg-red-50 p-4">
            <span className="text-3xl font-bold text-red-500">￥{selectedSku?.price || product.price}</span>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm text-gray-600">
              送至：<span className="text-gray-800">{product.shop?.name}</span>
            </p>
          </div>

          {/* SKU selection */}
          {product.skus?.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-gray-600">选择规格：</p>
              <div className="flex flex-wrap gap-2">
                {product.skus.map((sku: any) => (
                  <button
                    key={sku.id}
                    onClick={() => setSelectedSku(sku)}
                    className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                      selectedSku?.id === sku.id
                        ? 'border-red-500 bg-red-50 text-red-500'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {Object.values(JSON.parse(sku.specs || '{}')).join(' / ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-gray-600">数量：</span>
            <div className="flex items-center border rounded-lg">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-1 text-gray-500 hover:bg-gray-100">-</button>
              <span className="min-w-[3rem] text-center">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-3 py-1 text-gray-500 hover:bg-gray-100">+</button>
            </div>
            <span className="text-xs text-gray-400">库存 {selectedSku?.stock || 0} 件</span>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-4">
            <Button variant="outline" className="flex items-center gap-2" onClick={addToCart}>
              <ShoppingCart className="h-4 w-4" /> 加入购物车
            </Button>
            <Button onClick={buyNow}>立即购买</Button>
          </div>

          {/* Shop info */}
          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <Link href={`/shops/${product.shop?.id}`} className="text-sm font-medium text-blue-600 hover:underline">
              {product.shop?.name}
            </Link>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-8">
        <Card>
          <div className="border-b border-gray-100 px-6 py-4 font-medium">商品详情</div>
          <div className="px-6 py-4 text-sm text-gray-600 whitespace-pre-wrap">{product.description}</div>
        </Card>
      </div>

      {/* Reviews */}
      <div className="mt-4">
        <Card>
          <div className="border-b border-gray-100 px-6 py-4 font-medium">商品评价</div>
          <div className="px-6 py-4">
            {product.reviews?.length === 0 ? (
              <p className="text-sm text-gray-400">暂无评价</p>
            ) : (
              <div className="space-y-4">
                {product.reviews?.map((r: any) => (
                  <div key={r.id} className="border-b border-gray-50 pb-4 last:border-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{r.user?.nickname || '匿名用户'}</span>
                      <span className="text-yellow-400">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{r.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
