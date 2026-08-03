import { useEffect, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { api } from '@/api'
import { requireLogin } from '@/utils/auth'
import './index.scss'

export default function CourtPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (!requireLogin()) {
      setLoading(false)
      return
    }
    setLoading(true)
    api
      .courtLobby({ pageSize: 20 })
      .then((res) => setItems(res.data || []))
      .catch((err: Error) => Taro.showToast({ title: err.message, icon: 'none' }))
      .finally(() => setLoading(false))
  }

  useDidShow(() => load())
  useEffect(() => load(), [])

  const open = (id: number) => {
    Taro.navigateTo({ url: `/pages/court-detail/index?id=${id}` })
  }

  const deadlineText = (iso: string) => {
    const left = new Date(iso).getTime() - Date.now()
    if (left <= 0) return '已截止'
    return `${Math.floor(left / 3600000)}小时${Math.floor((left % 3600000) / 60000)}分后截止`
  }

  return (
    <View className='court'>
      <View className='court__head'>
        <Text className='court__title'>小法庭</Text>
        <Text className='court__badge'>投票可得法庭币</Text>
      </View>

      {loading ? (
        <View className='skeleton-list' />
      ) : items.length === 0 ? (
        <View className='court__empty'>
          <Text className='court__empty-icon'>⚖️</Text>
          <Text className='court__empty-text'>暂无进行中的案件</Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} className='court-card' onClick={() => open(item.id)}>
            <View className='court-card__top'>
              <Text className='court-card__no'>{item.caseNo}</Text>
              <Text className='court-card__status'>投票中</Text>
            </View>
            <Text className='court-card__name'>{item.productName || '售后案件'}</Text>
            <Text className='court-card__meta'>{item.shop?.name} · ¥{item.afterSale?.amount} · {item.votes || 0}/9 票</Text>
            <Text className='court-card__deadline'>{deadlineText(item.voteDeadline)}</Text>
          </View>
        ))
      )}
    </View>
  )
}
