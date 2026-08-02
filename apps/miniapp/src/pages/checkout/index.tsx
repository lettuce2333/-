import { useEffect, useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, ScrollView, Image, Input, Switch } from '@tarojs/components'
import { api, type Address, type CartItem, type Order } from '@/api'
import { formatPrice, parseImages, parseSpecs, fullImage } from '@/utils/format'
import { requireLogin } from '@/utils/auth'
import './index.scss'

interface CheckoutItem {
  skuId: number
  quantity: number
  productId?: number
  productName?: string
  price?: number
  image?: string
  specs?: string
}

const emptyAddr = { receiver: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false }

export default function CheckoutPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'cart' | 'buy'>('cart')
  const [items, setItems] = useState<CheckoutItem[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddr, setSelectedAddr] = useState<Address | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showAddrForm, setShowAddrForm] = useState(false)
  const [addrForm, setAddrForm] = useState(emptyAddr)
  const [openedAt, setOpenedAt] = useState('')

  useEffect(() => {
    if (!requireLogin()) return
    setOpenedAt(new Date().toISOString())
    const isBuy = router.params.mode === 'buy'
    setMode(isBuy ? 'buy' : 'cart')

    const buildItems = async (): Promise<CheckoutItem[]> => {
      if (isBuy) {
        const raw = Taro.getStorageSync<any[]>('buy_now') || []
        const enriched: CheckoutItem[] = []
        for (const it of raw) {
          try {
            const p = await api.product(it.productId)
            const sku = p.skus?.find((s) => s.id === it.skuId) || p.skus?.[0]
            if (sku) {
              enriched.push({
                productId: p.id,
                skuId: sku.id,
                quantity: it.quantity,
                productName: p.name,
                price: sku.price,
                image: parseImages(p.images)[0],
                specs: parseSpecs(sku.specs),
              })
            }
          } catch {
            Taro.showToast({ title: '商品信息加载失败', icon: 'none' })
          }
        }
        return enriched
      }

      const raw = Taro.getStorageSync<CartItem[]>('checkout_items') || []
      return raw.map((i) => ({
        productId: i.productId,
        skuId: i.skuId,
        quantity: i.quantity,
        productName: i.product?.name,
        price: i.sku?.price,
        image: parseImages(i.product?.images)[0],
        specs: parseSpecs(i.sku?.specs),
      }))
    }

    const loadAddresses = () =>
      api.addresses().then((addrs) => {
        const list = Array.isArray(addrs) ? addrs : []
        setAddresses(list)
        setSelectedAddr(list.find((a) => a.isDefault) || list[0] || null)
      })

    Promise.all([buildItems().then(setItems), loadAddresses()])
      .catch((err: any) => Taro.showToast({ title: err.message, icon: 'none' }))
      .finally(() => setLoading(false))
  }, [])

  const total = items.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0)

  const addAddress = async () => {
    try {
      const created = await api.createAddress(addrForm)
      const list = await api.addresses()
      const addrs = Array.isArray(list) ? list : []
      setAddresses(addrs)
      setSelectedAddr(addrs.find((a) => a.id === created?.id) || created || addrs[0] || null)
      setShowAddrForm(false)
      setAddrForm(emptyAddr)
      Taro.showToast({ title: '地址已添加', icon: 'success' })
    } catch (err: any) {
      Taro.showToast({ title: err.message, icon: 'none' })
    }
  }

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
        createdAt: openedAt || undefined,
        fromCart: mode === 'cart',
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
      .catch((err: any) => Taro.showToast({ title: err.message, icon: 'none' }))
      .finally(() => setSubmitting(false))
  }

  if (loading) {
    return <View className='checkout'><View className='skeleton' /></View>
  }

  return (
    <View className='checkout'>
      <ScrollView scrollY className='checkout__scroll'>
        <View className='panel'>
          <View className='panel__row'>
            <Text className='panel__title'>收货地址</Text>
            <Text className='panel__action' onClick={() => setShowAddrForm(!showAddrForm)}>
              {showAddrForm ? '收起' : '新增地址'}
            </Text>
          </View>

          {showAddrForm && (
            <View className='addr-form'>
              <Input className='addr-form__input' placeholder='收货人' value={addrForm.receiver} onInput={(e) => setAddrForm({ ...addrForm, receiver: e.detail.value })} />
              <Input className='addr-form__input' placeholder='手机号' value={addrForm.phone} onInput={(e) => setAddrForm({ ...addrForm, phone: e.detail.value })} />
              <View className='addr-form__row'>
                <Input className='addr-form__input addr-form__input--third' placeholder='省' value={addrForm.province} onInput={(e) => setAddrForm({ ...addrForm, province: e.detail.value })} />
                <Input className='addr-form__input addr-form__input--third' placeholder='市' value={addrForm.city} onInput={(e) => setAddrForm({ ...addrForm, city: e.detail.value })} />
                <Input className='addr-form__input addr-form__input--third' placeholder='区' value={addrForm.district} onInput={(e) => setAddrForm({ ...addrForm, district: e.detail.value })} />
              </View>
              <Input className='addr-form__input' placeholder='详细地址' value={addrForm.detail} onInput={(e) => setAddrForm({ ...addrForm, detail: e.detail.value })} />
              <View className='addr-form__default'>
                <Text className='addr-form__label'>设为默认地址</Text>
                <Switch checked={addrForm.isDefault} onChange={(e) => setAddrForm({ ...addrForm, isDefault: e.detail.value })} color='#b91c1c' />
              </View>
              <View className='addr-form__save' onClick={addAddress}>
                <Text>保存地址</Text>
              </View>
            </View>
          )}

          {addresses.length === 0 && !showAddrForm ? (
            <Text className='panel__empty'>暂无收货地址，请新增地址</Text>
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
