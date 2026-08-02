import { useEffect, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { api, type Review } from '@/api'
import { formatTime } from '@/utils/format'
import { requireLogin } from '@/utils/auth'
import './index.scss'

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (!requireLogin()) {
      setLoading(false)
      return
    }
    api
      .reviews()
      .then((res) => setReviews(res.data || []))
      .catch((err: any) => Taro.showToast({ title: err.message, icon: 'none' }))
      .finally(() => setLoading(false))
  }

  useDidShow(() => load())
  useEffect(() => load(), [])

  return (
    <View className='reviews-page'>
      <View className='reviews-page__head'>
        <Text className='reviews-page__title'>我的评价</Text>
      </View>
      <ScrollView scrollY className='reviews-page__scroll'>
        {loading ? (
          <View className='skeleton-list' />
        ) : reviews.length === 0 ? (
          <View className='reviews-page__empty'>
            <Text className='reviews-page__empty-icon'>⭐</Text>
            <Text className='reviews-page__empty-text'>暂无评价</Text>
          </View>
        ) : (
          reviews.map((r) => (
            <View key={r.id} className='review-card'>
              <Text className='review-card__product'>{r.product?.name || '商品'}</Text>
              <View className='review-card__stars'>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Text key={s} className={`review-card__star ${s <= r.rating ? 'review-card__star--on' : ''}`}>★</Text>
                ))}
                <Text className='review-card__time'>{formatTime(r.createdAt)}</Text>
              </View>
              <Text className='review-card__content'>{r.content}</Text>
              {r.replies && r.replies.length > 0 && (
                <View className='review-card__reply'>
                  <Text className='review-card__reply-title'>商家回复：</Text>
                  {r.replies.map((rp: any) => <Text key={rp.id} className='review-card__reply-text'>{rp.content}</Text>)}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}
