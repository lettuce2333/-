// ==================== Constants ====================

export const ORDER_STATUS = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAID: 'PAID',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  RECEIVED: 'RECEIVED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const AFTER_SALE_STATUS = {
  PENDING: 'PENDING',
  SHOP_APPROVED: 'SHOP_APPROVED',
  SHOP_REFUSED: 'SHOP_REFUSED',
  AUTO_APPROVED: 'AUTO_APPROVED',
  WAITING_RETURN: 'WAITING_RETURN',
  BUYER_SHIPPED: 'BUYER_SHIPPED',
  SHOP_RECEIVED: 'SHOP_RECEIVED',
  AUTO_RECEIVED: 'AUTO_RECEIVED',
  REFUNDED: 'REFUNDED',
  DISPUTE: 'DISPUTE',
  ADMIN_REFUND: 'ADMIN_REFUND',
  ADMIN_REJECT: 'ADMIN_REJECT',
  ADMIN_PARTIAL: 'ADMIN_PARTIAL',
  CLOSED: 'CLOSED',
} as const;
export type AfterSaleStatus = (typeof AFTER_SALE_STATUS)[keyof typeof AFTER_SALE_STATUS];

export const ROLES = {
  BUYER: 'buyer',
  VIP_BUYER: 'vip_buyer',
  SHOP_OWNER: 'shop_owner',
  SHOP_CS: 'shop_cs',
  SHOP_WAREHOUSE: 'shop_warehouse',
  SUPER_ADMIN: 'super_admin',
  BUSINESS_ADMIN: 'business_admin',
  CS_ADMIN: 'cs_admin',
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const SHOP_STATUS = { PENDING: 'pending', ACTIVE: 'active', REJECTED: 'rejected', BANNED: 'banned' } as const;
export const PRODUCT_STATUS = { DRAFT: 'draft', ACTIVE: 'active', REJECTED: 'rejected', ARCHIVED: 'archived' } as const;
export const USER_STATUS = { ACTIVE: 'active', BANNED: 'banned' } as const;
export const AFTER_SALE_TYPE = { REFUND_ONLY: 'refund_only', RETURN_REFUND: 'return_refund' } as const;
export const LOGISTICS_STATUS = { PENDING: 'pending', SHIPPED: 'shipped', DELIVERED: 'delivered', RECEIVED: 'received' } as const;

// ==================== DTOs ====================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  nickname?: string;
  phone?: string;
}

export interface JwtPayload {
  userId: number;
  roles: string[];
  currentRole: string;
  shopId?: number;
}

export interface AddressDto {
  receiver: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault?: boolean;
}

export interface CreateProductDto {
  categoryId: number;
  name: string;
  description?: string;
  images?: string[];
  skus: { specs: Record<string, string>; price: number; stock: number; image?: string }[];
}

export interface CreateOrderDto {
  addressId: number;
  items: { skuId: number; quantity: number }[];
  remark?: string;
}

export interface CreateAfterSaleDto {
  orderId: number;
  type: 'refund_only' | 'return_refund';
  reason: string;
  amount: number;
}

export interface CreateReviewDto {
  productId: number;
  orderId: number;
  rating: number;
  content: string;
  images?: string[];
  isAnonymous?: boolean;
}

// ==================== Order status helpers ====================

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: '待付款',
  PAID: '已付款',
  SHIPPED: '已发货',
  DELIVERED: '已送达',
  RECEIVED: '已收货',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  REFUNDED: '已退款',
};

export const AFTER_SALE_STATUS_LABELS: Record<string, string> = {
  PENDING: '待商家审核',
  SHOP_APPROVED: '商家已同意',
  SHOP_REFUSED: '商家已拒绝',
  AUTO_APPROVED: '系统自动同意',
  WAITING_RETURN: '等待用户寄回',
  BUYER_SHIPPED: '用户已寄回',
  SHOP_RECEIVED: '商家已收货',
  AUTO_RECEIVED: '系统自动确认收货',
  REFUNDED: '已退款',
  DISPUTE: '申诉中',
  ADMIN_REFUND: '管理员判定退款',
  ADMIN_REJECT: '管理员驳回',
  ADMIN_PARTIAL: '管理员判定部分退款',
  CLOSED: '已关闭',
};

export const SHOP_STATUS_LABELS: Record<string, string> = {
  pending: '待审核',
  active: '营业中',
  rejected: '已拒绝',
  banned: '已封禁',
};

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  active: '在售',
  rejected: '审核驳回',
  archived: '已归档',
};
