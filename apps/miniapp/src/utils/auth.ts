import Taro from '@tarojs/taro'

export function getToken(): string {
  return Taro.getStorageSync<string>('token')
}

export function setToken(token: string) {
  Taro.setStorageSync('token', token)
}

export function clearToken() {
  Taro.removeStorageSync('token')
}

export function isLoggedIn(): boolean {
  return Boolean(getToken())
}

export function requireLogin(): boolean {
  if (isLoggedIn()) return true
  Taro.showToast({ title: '请先登录', icon: 'none' })
  setTimeout(() => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }, 500)
  return false
}
