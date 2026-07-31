import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input, Button } from '@tarojs/components'
import { api } from '@/api'
import { setToken } from '@/utils/auth'
import './index.scss'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = () => {
    if (!email || !password) {
      Taro.showToast({ title: '请输入邮箱和密码', icon: 'none' })
      return
    }
    setLoading(true)
    api
      .login({ email, password })
      .then((res) => {
        setToken(res.accessToken)
        Taro.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => {
          Taro.navigateBack({
            fail: () => Taro.switchTab({ url: '/pages/mine/index' }),
          })
        }, 600)
      })
      .catch((err: Error) => {
        Taro.showToast({ title: err.message, icon: 'none' })
      })
      .finally(() => setLoading(false))
  }

  const fillTest = () => {
    setEmail('buyer@zuoye.com')
    setPassword('123456')
  }

  return (
    <View className='login'>
      <View className='login__hero'>
        <Text className='login__title'>优品商城</Text>
        <Text className='login__subtitle'>登录后体验完整购物流程</Text>
      </View>

      <View className='login__card'>
        <View className='field'>
          <Text className='field__label'>邮箱</Text>
          <Input
            className='field__input'
            placeholder='请输入邮箱'
            value={email}
            onInput={(e) => setEmail(e.detail.value)}
          />
        </View>
        <View className='field'>
          <Text className='field__label'>密码</Text>
          <Input
            className='field__input'
            placeholder='请输入密码'
            password
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
        </View>

        <Button className='login__btn' loading={loading} onClick={submit}>
          登录
        </Button>
        <View className='login__test' onClick={fillTest}>
          <Text>填入测试账号</Text>
        </View>
      </View>
    </View>
  )
}
