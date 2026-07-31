import Taro from '@tarojs/taro'

declare const TARO_APP_API_BASE: string

export const API_BASE = TARO_APP_API_BASE

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, unknown>
  auth?: boolean
}

export async function request<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', data, auth = true } = options
  const token = auth ? Taro.getStorageSync<string>('token') : ''
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    header.Authorization = `Bearer ${token}`
  }

  const res = await Taro.request({
    url: `${API_BASE}${url}`,
    method,
    data,
    header,
  })

  if (res.statusCode >= 200 && res.statusCode < 300) {
    return res.data as T
  }

  const message = (res.data as any)?.message || `请求失败（${res.statusCode}）`
  throw new Error(message)
}
