import { useEffect, useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import { api, type Address, type CartItem, type Order } from '@/api'
import { formatPrice, parseImages, parseSpecs, fullImage } from '@/utils/format'
import { requireLogin } from '@/utils/auth'
import './index.scss'

interface CheckoutItem {
  skuId: number
  quantity: number
  productName?: string
  price?: number
  image?: string
  specs?: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const [items, setItems] = useState<CheckoutItem[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddr, setSelectedAddr] = useState<Address | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!requireLogin()) return
    const mode = router.params.mode

    const buildItems = (): CheckoutItem[] => {
      if (mode === 'buy') {
        const raw = Taro.getStorageSync<any[]>('buy_now') || []
        return raw
      }
      const raw = Taro.getStorageSync<CartItem[]>('checkout_items') || []
      return raw.map((i) => ({
        skuId: i.skuId,
        quantity: i.quantity,
        productName: i.product?.name,
        price: i.sku?.price,
        image: parseImages(i.product?.images)[0],
        specs: parseSpecs(i.sku?.specs),
      }))
    }

    setItems(buildItems())

    api
      .addresses()
      .then((addrs) => {
        const list = Array.isArray(addrs) ? addrs : []
        setAddresses(list)
        setSelectedAddr(list.find((a) => a.isDefault) || list[0] || null)
      })
      .catch((err: Error) => Taro.showToast({ title: err.message, icon: 'none' }))
      .finally(() => setLoading(false))
  }, [])

  const total = items.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0)

  const submit = () => {
    if (!selectedAddr) {
      Taro.showToast({ title: '请选择收货地址', icon: 'none' })
      return
    }
    if (items.length === 0) {
      Taro.showToast({ title: '没有可结算的商品', icon: 'none' })
      return
    }
    setSubmitting(true)
    api
      .createOrder({
        addressId: selectedAddr.id,
        items: items.map((i) => ({ skuId: i.skuId, quantity: i.quantity })),
      })
      .then(async (res) => {
        const order = Array.isArray(res) ? res[0] : (res as unknown as Order)
        if (order?.id) {
          await api.payOrder(order.id).catch(() => {})
        }
        Taro.removeStorageSync('checkout_items')
        Taro.removeStorageSync('buy_now')
        Taro.showToast({ title: '下单成功', icon: 'success' })
        setTimeout(() => {
          Taro.redirectTo({ url: '/pages/orders/index' })
        }, 800)
      })
      .catch((err: Error) => Taro.showToast({ title: err.message, icon: 'none' }))
      .finally(() => setSubmitting(false))
  }

  if (loading) {
    return <View className='checkout'><View className='skeleton' /></View>
  }

  return (
    <View className='checkout'>
      <ScrollView scrollY className='checkout__scroll'>
        <View className='panel'>
          <Text className='panel__title'>收货地址</Text>
          {addresses.length === 0 ? (
            <Text className='panel__empty'>暂无收货地址，请到网页端添加</Text>
          ) : (
            addresses.map((addr) => (
              <View
                key={addr.id}
                className={`addr ${selectedAddr?.id === addr.id ? 'addr--active' : ''}`}
                onClick={() => setSelectedAddr(addr)}
              >
                <View className='addr__info'>
                  <Text className='addr__name'>{addr.receiver} {addr.phone}</Text>
                  <Text className='addr__detail'>{addr.province}{addr.city}{addr.district}{addr.detail}</Text>
                </View>
                {addr.isDefault && <Text className='addr__tag'>默认</Text>}
              </View>
            ))
          )}
        </View>

        <View className='panel'>
          <Text className='panel__title'>商品清单</Text>
          {items.map((item, idx) => (
            <View key={idx} className='item'>
              <View className='item__cover'>
                {item.image ? (
                  <Image className='item__img' src={fullImage(item.image)} mode='aspectFill' />
                ) : (
                  <Text>📦</Text>
                )}
              </View>
              <View className='item__body'>
                <Text className='item__name' numberOfLines={1}>{item.productName || '商品'}</Text>
                {item.specs && <Text className='item__specs'>{item.specs}</Text>}
                <Text className='item__qty'>x{item.quantity}</Text>
              </View>
              <Text className='item__price'>¥{formatPrice((item.price || 0) * item.quantity)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View className='checkout__footer'>
        <View>
          <Text className='checkout__label'>合计：</Text>
          <Text className='checkout__total'>¥{formatPrice(total)}</Text>
        </View>
        <View className={`checkout__submit ${submitting ? 'checkout__submit--disabled' : ''}`} onClick={submit}>
          <Text>{submitting ? '提交中...' : '提交订单'}</Text>
        </View>
      </View>
    </View>
  )
}
