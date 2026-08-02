import { useEffect, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { api, type NotificationItem } from '@/api'
import { formatTime } from '@/utils/format'
import { requireLogin } from '@/utils/auth'
import './index.scss'

const typeLabels: Record<string, string> = {
  order: '订单通知',
  after_sale: '售后通知',
  system: '系统通知',
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)

  const refreshCount = () => {
    api.unreadNotifications().then((res) => setUnread(res?.count || 0)).catch(() => {})
  }

  const load = () => {
    if (!requireLogin()) {
      setLoading(false)
      return
    }
    api
      .notifications()
      .then((res) => setItems(res.data || []))
      .catch((err: any) => Taro.showToast({ title: err.message, icon: 'none' }))
      .finally(() => {
        setLoading(false)
        refreshCount()
      })
  }

  useDidShow(() => load())
  useEffect(() => load(), [])

  const markRead = (id: number) => {
    api
      .markNotificationRead(id)
      .then(() => {
        setItems(items.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
        setUnread(Math.max(0, unread - 1))
      })
      .catch((err: any) => Taro.showToast({ title: err.message, icon: 'none' }))
  }

  const markAll = () => {
    api
      .markAllNotificationsRead()
      .then(() => {
        setItems(items.map((n) => ({ ...n, isRead: true })))
        setUnread(0)
      })
      .catch((err: any) => Taro.showToast({ title: err.message, icon: 'none' }))
  }

  return (
    <View className='notify-page'>
      <View className='notify-page__head'>
        <Text className='notify-page__title'>消息通知</Text>
        {unread > 0 && (
          <Text className='notify-page__all' onClick={markAll}>全部已读</Text>
        )}
      </View>
      <ScrollView scrollY className='notify-page__scroll'>
        {loading ? (
          <View className='skeleton-list' />
        ) : items.length === 0 ? (
          <View className='notify-page__empty'>
            <Text className='notify-page__empty-icon'>🔔</Text>
            <Text className='notify-page__empty-text'>暂无通知</Text>
          </View>
        ) : (
          items.map((n) => (
            <View key={n.id} className={`notify-card ${!n.isRead ? 'notify-card--unread' : ''}`}>
              <View className='notify-card__head'>
                <Text className='notify-card__type'>{typeLabels[n.type] || n.type}</Text>
                {!n.isRead && <Text className='notify-card__dot' />}
                <Text className='notify-card__time'>{formatTime(n.createdAt)}</Text>
              </View>
              <Text className='notify-card__title'>{n.title}</Text>
              {n.content && <Text className='notify-card__content'>{n.content}</Text>}
              {!n.isRead && (
                <Text className='notify-card__read' onClick={() => markRead(n.id)}>标为已读</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}
