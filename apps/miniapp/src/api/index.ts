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
  afterSales?: any[]
}

export interface OrderDetail extends Order {
  receiverName?: string
  receiverPhone?: string
  receiverAddress?: string
  paidAt?: string
  shippedAt?: string
  logistics?: { company: string; trackingNo: string }
  afterSales?: any[]
}

export interface Review {
  id: number
  productId: number
  rating: number
  content: string
  createdAt: string
  product?: { id: number; name: string; images?: string }
  replies?: any[]
}

export interface NotificationItem {
  id: number
  type: string
  title: string
  content?: string
  isRead: number | boolean
  createdAt: string
}

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export const api = {
  // Auth
  login: (data: LoginDto) => request<{ accessToken: string; user: any }>('/api/auth/login', { method: 'POST', data: data as unknown as Record<string, unknown>, auth: false }),
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
  createOrder: (data: { addressId: number; items: { skuId: number; quantity: number }[]; createdAt?: string; fromCart?: boolean }) =>
    request<Order[]>('/api/orders', { method: 'POST', data }),
  orders: (params: Record<string, unknown> = {}) => request<Paginated<Order>>(`/api/orders?${toQuery(params)}`),
  order: (id: number) => request<OrderDetail>(`/api/orders/${id}`),
  payOrder: (id: number) => request(`/api/orders/${id}/pay`, { method: 'POST' }),
  cancelOrder: (id: number) => request(`/api/orders/${id}/cancel`, { method: 'POST', data: { reason: '用户取消' } }),
  receiveOrder: (id: number) => request(`/api/orders/${id}/receive`, { method: 'POST' }),
  createReview: (data: { orderId: number; productId: number; rating: number; content: string }) =>
    request('/api/reviews', { method: 'POST', data }),
  createAfterSale: (data: { orderId: number; type: string; reason: string; amount: number }) =>
    request('/api/after-sales', { method: 'POST', data }),

  // Small court
  courtLobby: (params: Record<string, unknown> = {}) => request<Paginated<any>>(`/api/court/lobby?${toQuery(params)}`),
  courtMy: () => request<any[]>('/api/court/my'),
  courtDetail: (id: number) => request<any>(`/api/court/${id}`),
  courtVote: (id: number, side: string, comment?: string) =>
    request(`/api/court/${id}/vote`, { method: 'POST', data: { side, comment } }),
  courtEvidence: (id: number, data: Record<string, unknown>) =>
    request(`/api/court/${id}/evidence`, { method: 'POST', data }),
  openCourt: (afterSaleId: number) => request(`/api/after-sales/${afterSaleId}/court-open`, { method: 'POST' }),

  // Tokens
  tokenMe: () => request<any>('/api/tokens/me'),
  tokenCoupons: () => request<any[]>('/api/tokens/coupons'),
  redeemCoupon: (amount: number) => request('/api/tokens/redeem/coupon', { method: 'POST', data: { amount } }),
  redeemProducts: () => request<any[]>('/api/tokens/redeem/products'),
  redeemProduct: (skuId: number, quantity: number) =>
    request('/api/tokens/redeem/product', { method: 'POST', data: { skuId, quantity } }),
  tokenRedemptions: () => request<any[]>('/api/tokens/redemptions'),

  // Addresses
  createAddress: (data: { receiver: string; phone: string; province: string; city: string; district: string; detail: string; isDefault: boolean }) =>
    request<Address>('/api/users/addresses', { method: 'POST', data }),
  removeAddress: (id: number) => request(`/api/users/addresses/${id}`, { method: 'DELETE' }),

  // Reviews & notifications
  reviews: (params: Record<string, unknown> = {}) => request<Paginated<Review>>(`/api/reviews?${toQuery(params)}`),
  notifications: (params: Record<string, unknown> = {}) => request<Paginated<NotificationItem>>(`/api/notifications?${toQuery(params)}`),
  unreadNotifications: () => request<{ count: number }>('/api/notifications/unread-count'),
  markNotificationRead: (id: number) => request(`/api/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => request('/api/notifications/read-all', { method: 'POST' }),
}

function toQuery(params: Record<string, unknown>): string {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
}
