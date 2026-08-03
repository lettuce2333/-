import { useEffect, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { api } from '@/api'
import { requireLogin } from '@/utils/auth'
import './index.scss'

const TYPE_LABELS: Record<string, string> = {
  court_reward: '小法庭判案奖励',
  redeem_coupon: '兑换优惠券',
  redeem_product: '兑换商品',
}

export default function TokensPage() {
  const [me, setMe] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (!requireLogin()) {
      setLoading(false)
      return
    }
    api
      .tokenMe()
      .then((res) => setMe(res))
      .catch((err: Error) => Taro.showToast({ title: err.message, icon: 'none' }))
      .finally(() => setLoading(false))
  }

  useDidShow(() => load())
  useEffect(() => load(), [])

  const goRedeem = () => {
    Taro.navigateTo({ url: '/pages/tokens-redeem/index' })
  }

  return (
    <View className='tokens'>
      <View className='tokens__head'>
        <Text className='tokens__title'>法庭币钱包</Text>
        <View className='btn btn--primary' onClick={goRedeem}>
          <Text>兑换中心</Text>
        </View>
      </View>

      <View className='tokens__balance'>
        <Text className='tokens__balance-num'>{me?.balance ?? 0}</Text>
        <Text className='tokens__balance-label'>可用法庭币 · 累计获得 {me?.totalEarned ?? 0}</Text>
      </View>

      <View className='tokens__list'>
        <Text className='tokens__list-title'>最近流水</Text>
        {me?.transactions?.length === 0 || !me?.transactions ? (
          <Text className='tokens__empty'>暂无流水</Text>
        ) : (
          me.transactions.map((t: any) => (
            <View key={t.id} className='token-row'>
              <View>
                <Text className='token-row__type'>{TYPE_LABELS[t.type] || t.type}</Text>
                <Text className='token-row__time'>{new Date(t.createdAt).toLocaleString()}</Text>
              </View>
              <Text className={t.amount > 0 ? 'token-row__amount--plus' : 'token-row__amount--minus'}>
                {t.amount > 0 ? '+' : ''}{t.amount}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  )
}
