import { useEffect, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { api } from '@/api'
import { isLoggedIn, clearToken } from '@/utils/auth'
import './index.scss'

export default function MinePage() {
  const [user, setUser] = useState<any>(null)

  const load = () => {
    if (!isLoggedIn()) {
      setUser(null)
      Taro.removeTabBarBadge({ index: 3 }).catch(() => {})
      return
    }
    api
      .me()
      .then((res) => {
        setUser(res)
        api.unreadNotifications().then((u) => {
          if (u?.count > 0) {
            Taro.setTabBarBadge({ index: 3, text: String(u.count > 99 ? 99 : u.count) }).catch(() => {})
          } else {
            Taro.removeTabBarBadge({ index: 3 }).catch(() => {})
          }
        }).catch(() => {})
      })
      .catch(() => {
        setUser(null)
        Taro.removeTabBarBadge({ index: 3 }).catch(() => {})
      })
  }

  useDidShow(() => load())
  useEffect(() => load(), [])

  const goLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  const goOrders = () => {
    Taro.navigateTo({ url: '/pages/orders/index' })
  }

  const goCourt = () => {
    Taro.navigateTo({ url: '/pages/court/index' })
  }

  const goTokens = () => {
    Taro.navigateTo({ url: '/pages/tokens/index' })
  }

  const goAddress = () => {
    Taro.navigateTo({ url: '/pages/address/index' })
  }

  const goReviews = () => {
    Taro.navigateTo({ url: '/pages/reviews/index' })
  }

  const goNotifications = () => {
    Taro.navigateTo({ url: '/pages/notifications/index' })
  }

  const logout = () => {
    clearToken()
    setUser(null)
    Taro.showToast({ title: '已退出', icon: 'success' })
  }

  return (
    <View className='mine'>
      <View className='mine__hero'>
        <View className='mine__avatar'>
          <Text>{user ? (user.nickname || user.email || 'U').slice(0, 1).toUpperCase() : '客'}</Text>
        </View>
        <View className='mine__identity'>
          <Text className='mine__name'>{user ? user.nickname || user.email : '未登录'}</Text>
          <Text className='mine__email'>{user?.email || '登录后体验完整购物流程'}</Text>
        </View>
      </View>

      <View className='mine__menu'>
        <View className='menu-item' onClick={goOrders}>
          <Text className='menu-item__icon'>📋</Text>
          <Text className='menu-item__label'>我的订单</Text>
          <Text className='menu-item__arrow'>›</Text>
        </View>
        <View className='menu-item' onClick={goCourt}>
          <Text className='menu-item__icon'>⚖️</Text>
          <Text className='menu-item__label'>小法庭</Text>
          <Text className='menu-item__arrow'>›</Text>
        </View>
        <View className='menu-item' onClick={goTokens}>
          <Text className='menu-item__icon'>🪙</Text>
          <Text className='menu-item__label'>法庭币钱包</Text>
          <Text className='menu-item__arrow'>›</Text>
        </View>
        <View className='menu-item' onClick={goAddress}>
          <Text className='menu-item__icon'>📍</Text>
          <Text className='menu-item__label'>收货地址</Text>
          <Text className='menu-item__arrow'>›</Text>
        </View>
        <View className='menu-item' onClick={goReviews}>
          <Text className='menu-item__icon'>⭐</Text>
          <Text className='menu-item__label'>我的评价</Text>
          <Text className='menu-item__arrow'>›</Text>
        </View>
        <View className='menu-item' onClick={goNotifications}>
          <Text className='menu-item__icon'>🔔</Text>
          <Text className='menu-item__label'>消息通知</Text>
          <Text className='menu-item__arrow'>›</Text>
        </View>
      </View>

      {user ? (
        <View className='mine__logout' onClick={logout}>
          <Text>退出登录</Text>
        </View>
      ) : (
        <View className='mine__login-btn' onClick={goLogin}>
          <Text>登录 / 注册</Text>
        </View>
      )}
    </View>
  )
}
