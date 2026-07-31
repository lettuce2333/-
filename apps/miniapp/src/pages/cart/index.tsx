import { useEffect, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import { api, type CartItem } from '@/api'
import { formatPrice, parseImages, parseSpecs, fullImage } from '@/utils/format'
import { requireLogin } from '@/utils/auth'
import './index.scss'

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const load = () => {
    if (!requireLogin()) {
      setLoading(false)
      return
    }
    setLoading(true)
    api
      .cart()
      .then((res) => {
        const data = Array.isArray(res) ? res : []
        setItems(data)
        setSelected(new Set(data.map((i) => i.id)))
      })
      .catch((err: Error) => Taro.showToast({ title: err.message, icon: 'none' }))
      .finally(() => setLoading(false))
  }

  useDidShow(() => load())
  useEffect(() => load(), [])

  const toggle = (id: number) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const changeQty = (item: CartItem, delta: number) => {
    const nextQty = item.quantity + delta
    if (nextQty < 1) return
    api
      .updateCartQuantity(item.id, nextQty)
      .then(() => {
        setItems(items.map((i) => (i.id === item.id ? { ...i, quantity: nextQty } : i)))
      })
      .catch((err: Error) => Taro.showToast({ title: err.message, icon: 'none' }))
  }

  const remove = (id: number) => {
    api
      .removeCartItem(id)
      .then(() => {
        setItems(items.filter((i) => i.id !== id))
        const next = new Set(selected)
        next.delete(id)
        setSelected(next)
      })
      .catch((err: Error) => Taro.showToast({ title: err.message, icon: 'none' }))
  }

  const total = items
    .filter((i) => selected.has(i.id))
    .reduce((sum, i) => sum + (i.sku?.price || 0) * i.quantity, 0)

  const checkout = () => {
    if (selected.size === 0) {
      Taro.showToast({ title: '请选择商品', icon: 'none' })
      return
    }
    const selectedItems = items.filter((i) => selected.has(i.id))
    Taro.setStorageSync('checkout_items', selectedItems)
    Taro.navigateTo({ url: '/pages/checkout/index?mode=cart' })
  }

  if (loading) {
    return <View className='cart'><View className='skeleton-list' /></View>
  }

  return (
    <View className='cart'>
      <View className='cart__head'>
        <Text className='cart__title'>购物车</Text>
        <Text className='cart__count'>{items.length} 件商品</Text>
      </View>

      {items.length === 0 ? (
        <View className='cart__empty'>
          <Text className='cart__empty-icon'>🛒</Text>
          <Text className='cart__empty-text'>购物车是空的</Text>
        </View>
      ) : (
        <ScrollView scrollY className='cart__list'>
          {items.map((item) => {
            const images = parseImages(item.product?.images)
            const cover = images[0]
            return (
              <View key={item.id} className='cart-item'>
                <View className={`check ${selected.has(item.id) ? 'check--on' : ''}`} onClick={() => toggle(item.id)}>
                  {selected.has(item.id) && <Text>✓</Text>}
                </View>
                <View className='cart-item__cover'>
                  {cover ? (
                    <Image className='cart-item__img' src={fullImage(cover)} mode='aspectFill' />
                  ) : (
                    <Text>📦</Text>
                  )}
                </View>
                <View className='cart-item__body'>
                  <Text className='cart-item__name' numberOfLines={1}>{item.product?.name}</Text>
                  <Text className='cart-item__specs'>{parseSpecs(item.sku?.specs)}</Text>
                  <View className='cart-item__bottom'>
                    <Text className='cart-item__price'>¥{formatPrice(item.sku?.price)}</Text>
                    <View className='stepper'>
                      <View className='stepper__btn' onClick={() => changeQty(item, -1)}><Text>-</Text></View>
                      <Text className='stepper__value'>{item.quantity}</Text>
                      <View className='stepper__btn' onClick={() => changeQty(item, 1)}><Text>+</Text></View>
                    </View>
                  </View>
                </View>
                <View className='cart-item__remove' onClick={() => remove(item.id)}>
                  <Text>删除</Text>
                </View>
              </View>
            )
          })}
        </ScrollView>
      )}

      <View className='cart__footer'>
        <View>
          <Text className='cart__selected'>已选 {selected.size} 件</Text>
          <Text className='cart__total'>合计 ¥{formatPrice(total)}</Text>
        </View>
        <View className='cart__checkout' onClick={checkout}>
          <Text>去结算</Text>
        </View>
      </View>
    </View>
  )
}
