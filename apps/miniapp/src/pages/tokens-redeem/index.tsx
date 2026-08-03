import { useEffect, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, Picker, Input } from '@tarojs/components'
import { api } from '@/api'
import { requireLogin } from '@/utils/auth'
import './index.scss'

const COUPON_OPTIONS = [1, 5, 10, 20]

export default function TokensRedeemPage() {
  const [balance, setBalance] = useState(0)
  const [coupons, setCoupons] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [redemptions, setRedemptions] = useState<any[]>([])
  const [couponIndex, setCouponIndex] = useState(0)
  const [skus, setSkus] = useState<Record<number, number>>({})
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [busy, setBusy] = useState(false)

  const load = () => {
    if (!requireLogin()) return
    Promise.all([api.tokenMe(), api.tokenCoupons(), api.redeemProducts(), api.tokenRedemptions()])
      .then(([me, cps, pds, rds]) => {
        setBalance(me?.balance || 0)
        setCoupons(cps || [])
        setProducts(pds || [])
        setRedemptions(rds || [])
      })
      .catch((err: Error) => Taro.showToast({ title: err.message, icon: 'none' }))
  }

  useDidShow(() => load())
  useEffect(() => load(), [])

  const redeemCoupon = () => {
    const amount = COUPON_OPTIONS[couponIndex]
    if (amount * 100 > balance) {
      Taro.showToast({ title: '法庭币不足', icon: 'none' })
      return
    }
    setBusy(true)
    api
      .redeemCoupon(amount)
      .then(() => {
        Taro.showToast({ title: '兑换成功', icon: 'success' })
        load()
      })
      .catch((err: Error) => Taro.showToast({ title: err.message, icon: 'none' }))
      .finally(() => setBusy(false))
  }

  const redeemProduct = (product: any) => {
    const skuList = product.skus || []
    const skuId = skus[product.id] ?? skuList[0]?.id
    const qty = quantities[product.id] || 1
    if (!skuId) {
      Taro.showToast({ title: '请选择规格', icon: 'none' })
      return
    }
    setBusy(true)
    api
      .redeemProduct(skuId, qty)
      .then(() => {
        Taro.showToast({ title: '兑换成功', icon: 'success' })
        load()
      })
      .catch((err: Error) => Taro.showToast({ title: err.message, icon: 'none' }))
      .finally(() => setBusy(false))
  }

  return (
    <View className='redeem'>
      <View className='redeem__head'>
        <Text className='redeem__title'>兑换中心</Text>
        <Text className='redeem__balance'>可用 {balance} 币</Text>
      </View>

      <View className='redeem__section'>
        <Text className='redeem__section-title'>兑换优惠券（100 币 = 1 元）</Text>
        <View className='redeem__coupon'>
          <Picker mode='selector' range={COUPON_OPTIONS.map((v) => `${v}元券（${v * 100}币）`)} onChange={(e) => setCouponIndex(Number(e.detail.value))}>
            <View className='redeem__picker'>
              <Text>{COUPON_OPTIONS[couponIndex]}元券（{COUPON_OPTIONS[couponIndex] * 100}币）</Text>
            </View>
          </Picker>
          <View className={`btn ${COUPON_OPTIONS[couponIndex] * 100 > balance ? 'btn--disabled' : 'btn--primary'}`} onClick={redeemCoupon}>
            <Text>{busy ? '兑换中...' : '立即兑换'}</Text>
          </View>
        </View>
        <View className='redeem__coupon-list'>
          <Text className='redeem__coupon-label'>我的优惠券：</Text>
          {coupons.length === 0 ? (
            <Text className='redeem__muted'>暂无可用优惠券</Text>
          ) : (
            coupons.map((c) => (
              <Text key={c.id} className='redeem__coupon-tag'>{c.title}</Text>
            ))
          )}
        </View>
      </View>

      <View className='redeem__section'>
        <Text className='redeem__section-title'>兑换商品</Text>
        {products.length === 0 ? (
          <Text className='redeem__muted'>暂无可兑换商品</Text>
        ) : (
          products.map((p) => {
            const skuList = p.skus || []
            const skuId = skus[p.id] ?? skuList[0]?.id
            const sku = skuList.find((s: any) => s.id === skuId)
            return (
              <View key={p.id} className='product-card'>
                <Text className='product-card__name'>{p.name}</Text>
                <Text className='product-card__price'>{p.tokenPrice} 币/件 · 库存 {sku?.stock ?? 0}</Text>
                <View className='product-card__controls'>
                  <Picker
                    mode='selector'
                    range={skuList.map((s: any) => `${s.specs || '默认规格'}（${s.stock}）`)}
                    onChange={(e) => setSkus({ ...skus, [p.id]: skuList[Number(e.detail.value)]?.id })}
                  >
                    <View className='redeem__picker redeem__picker--sm'>
                      <Text>{sku?.specs || '选择规格'}</Text>
                    </View>
                  </Picker>
                  <Input
                    className='product-card__qty'
                    type='number'
                    value={String(quantities[p.id] || 1)}
                    onInput={(e) => setQuantities({ ...quantities, [p.id]: parseInt(e.detail.value, 10) || 1 })}
                  />
                </View>
                <View className={`btn ${(p.tokenPrice * (quantities[p.id] || 1)) > balance ? 'btn--disabled' : 'btn--primary'}`} onClick={() => redeemProduct(p)}>
                  <Text>{busy ? '兑换中...' : '兑换'}</Text>
                </View>
              </View>
            )
          })
        )}
      </View>

      <View className='redeem__section'>
        <Text className='redeem__section-title'>兑换记录</Text>
        {redemptions.length === 0 ? (
          <Text className='redeem__muted'>暂无兑换记录</Text>
        ) : (
          redemptions.map((r) => (
            <View key={r.id} className='redeem-record'>
              <View>
                <Text className='redeem-record__no'>{r.orderNo}</Text>
                <Text className='redeem-record__items'>
                  {r.items?.map((i: any) => `${i.productName} x${i.quantity}`).join('、')}
                </Text>
              </View>
              <Text className='redeem-record__tokens'>-{r.totalTokens} 币</Text>
            </View>
          ))
        )}
      </View>
    </View>
  )
}
