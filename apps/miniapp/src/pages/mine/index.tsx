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
      return
    }
    api
      .me()
      .then(setUser)
      .catch(() => setUser(null))
  }

  useDidShow(() => load())
  useEffect(() => load(), [])

  const goLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  const goOrders = () => {
    Taro.navigateTo({ url: '/pages/orders/index' })
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
