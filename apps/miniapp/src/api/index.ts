import { request } from './request'
import type { LoginDto } from '@/constants'

export interface ProductItem {
  id: number
  shopId: number
  categoryId: number
  name: string
  description?: string
  images: string
  price: number
  totalStock: number
  sales: number
  status: string
}

export interface ProductDetail extends ProductItem {
  skus: ProductSku[]
  shop?: { id: number; name: string; logo?: string }
  category?: { id: number; name: string }
}

export interface ProductSku {
  id: number
  productId: number
  specs: string
  price: number
  stock: number
  image?: string
}

export interface Category {
  id: number
  name: string
  level: number
  sort: number
  parentId?: number
}

export interface CartItem {
  id: number
  productId: number
  skuId: number
  quantity: number
  product?: { id: number; name: string; images: string; status: string }
  sku?: ProductSku
}

export interface Address {
  id: number
  receiver: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault: boolean
}

export interface OrderItem {
  id: number
  productId: number
  skuId: number
  productName: string
  skuSpecs: string
  quantity: number
  unitPrice: number
  subtotal: number
  image?: string
}

export interface Order {
  id: number
  orderNo: string
  totalAmount: number
  status: string
  createdAt: string
  items?: OrderItem[]
}

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export const api = {
  // Auth
  login: (data: LoginDto) => request<{ accessToken: string; user: any }>('/api/auth/login', { method: 'POST', data, auth: false }),
  me: () => request<any>('/api/auth/me'),

  // Products & categories
  products: (params: Record<string, unknown> = {}) => request<Paginated<ProductItem>>(`/api/products?${toQuery(params)}`),
  product: (id: number) => request<ProductDetail>(`/api/products/${id}`),
  categories: () => request<Category[]>('/api/categories'),

  // Cart
  cart: () => request<CartItem[]>('/api/cart'),
  addToCart: (data: { productId: number; skuId: number; quantity: number }) =>
    request('/api/cart', { method: 'POST', data }),
  updateCartQuantity: (id: number, quantity: number) =>
    request(`/api/cart/${id}`, { method: 'PUT', data: { quantity } }),
  removeCartItem: (id: number) => request(`/api/cart/${id}`, { method: 'DELETE' }),

  // Addresses
  addresses: () => request<Address[]>('/api/users/addresses'),

  // Orders
  createOrder: (data: { addressId: number; items: { skuId: number; quantity: number }[] }) =>
    request<Order[]>('/api/orders', { method: 'POST', data }),
  orders: (params: Record<string, unknown> = {}) => request<Paginated<Order>>(`/api/orders?${toQuery(params)}`),
  payOrder: (id: number) => request(`/api/orders/${id}/pay`, { method: 'POST' }),
  cancelOrder: (id: number) => request(`/api/orders/${id}/cancel`, { method: 'POST', data: { reason: '用户取消' } }),
  receiveOrder: (id: number) => request(`/api/orders/${id}/receive`, { method: 'POST' }),
}

function toQuery(params: Record<string, unknown>): string {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
}
