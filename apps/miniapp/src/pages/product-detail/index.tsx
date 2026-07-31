import { useEffect, useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { api, type ProductDetail, type ProductSku } from '@/api'
import { formatPrice, fullImage, parseImages, parseSpecs } from '@/utils/format'
import { requireLogin } from '@/utils/auth'
import './index.scss'

export default function ProductDetailPage() {
  const router = useRouter()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSku, setSelectedSku] = useState<ProductSku | null>(null)
  const [quantity, setQuantity] = useState(1)

  const id = Number(router.params.id)

  useEffect(() => {
    if (!id) return
    api
      .product(id)
      .then((res) => {
        setProduct(res)
        if (res.skus?.length) {
          setSelectedSku(res.skus[0])
        }
      })
      .catch(() => Taro.showToast({ title: '加载失败', icon: 'none' }))
      .finally(() => setLoading(false))
  }, [id])

  const addToCart = () => {
    if (!requireLogin()) return
    if (!product || !selectedSku) return
    api
      .addToCart({ productId: product.id, skuId: selectedSku.id, quantity })
      .then(() => {
        Taro.showToast({ title: '已加入购物车', icon: 'success' })
      })
      .catch((err: Error) => Taro.showToast({ title: err.message, icon: 'none' }))
  }

  const buyNow = () => {
    if (!requireLogin()) return
    if (!product || !selectedSku) return
    Taro.setStorageSync('buy_now', [{ skuId: selectedSku.id, quantity }])
    Taro.navigateTo({ url: '/pages/checkout/index?mode=buy' })
  }

  if (loading) {
    return (
      <View className='detail'>
        <View className='skeleton-cover' />
      </View>
    )
  }

  if (!product) {
    return (
      <View className='empty'>
        <Text>商品不存在</Text>
      </View>
    )
  }

  const images = parseImages(product.images)
  const cover = images[0]

  return (
    <View className='detail'>
      <ScrollView scrollY className='detail-scroll'>
        <View className='cover'>
          {cover ? (
            <Image className='cover__image' src={fullImage(cover)} mode='aspectFill' />
          ) : (
            <Text className='cover__placeholder'>📦</Text>
          )}
        </View>

        <View className='panel'>
          <View className='price-row'>
            <Text className='price'>¥{formatPrice(selectedSku?.price ?? product.price)}</Text>
            <Text className='sales'>已售 {product.sales}</Text>
          </View>
          <Text className='name'>{product.name}</Text>
          {product.description && <Text className='desc'>{product.description}</Text>}
        </View>

        <View className='panel'>
          <Text className='panel-title'>选择规格</Text>
          <View className='sku-list'>
            {product.skus?.map((sku) => (
              <View
                key={sku.id}
                className={`sku-item ${selectedSku?.id === sku.id ? 'sku-item--active' : ''}`}
                onClick={() => setSelectedSku(sku)}
              >
                <Text>{parseSpecs(sku.specs) || '默认'}</Text>
                <Text className='sku-item__price'>¥{formatPrice(sku.price)}</Text>
              </View>
            ))}
          </View>
          {selectedSku && <Text className='stock'>库存 {selectedSku.stock} 件</Text>}
        </View>

        <View className='panel qty-panel'>
          <Text className='panel-title'>购买数量</Text>
          <View className='qty'>
            <View className='qty__btn' onClick={() => setQuantity(Math.max(1, quantity - 1))}>
              <Text>-</Text>
            </View>
            <Text className='qty__value'>{quantity}</Text>
            <View
              className='qty__btn'
              onClick={() => setQuantity(Math.min(selectedSku?.stock || 99, quantity + 1))}
            >
              <Text>+</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className='action-bar'>
        <View className='action-bar__btn action-bar__btn--cart' onClick={addToCart}>
          <Text>加入购物车</Text>
        </View>
        <View className='action-bar__btn action-bar__btn--buy' onClick={buyNow}>
          <Text>立即购买</Text>
        </View>
      </View>
    </View>
  )
}
