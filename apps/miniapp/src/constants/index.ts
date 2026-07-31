export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: '待付款',
  PAID: '已付款',
  SHIPPED: '已发货',
  DELIVERED: '已送达',
  RECEIVED: '已收货',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  REFUNDED: '已退款',
}

export interface LoginDto {
  email: string
  password: string
}
