import { useEffect, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { api, type Order } from '@/api'
import { formatPrice, formatTime } from '@/utils/format'
import { ORDER_STATUS_LABELS } from '@/constants'
import { requireLogin } from '@/utils/auth'
import './index.scss'

const FILTERS = [
  { key: '', label: '全部' },
  { key: 'PENDING_PAYMENT', label: '待付款' },
  { key: 'PAID', label: '待发货' },
  { key: 'SHIPPED', label: '已发货' },
  { key: 'RECEIVED', label: '已收货' },
  { key: 'AFTER_SALE', label: '售后中' },
  { key: 'COMPLETED', label: '已完成' },
]

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (!requireLogin()) {
      setLoading(false)
      return
    }
    setLoading(true)
    const params: Record<string, unknown> = { pageSize: 20 }
    if (filter) params.status = filter
    api
      .orders(params)
      .then((res) => setOrders(res.data || []))
      .catch((err: Error) => Taro.showToast({ title: err.message, icon: 'none' }))
      .finally(() => setLoading(false))
  }

  useDidShow(() => load())
  useEffect(() => load(), [filter])

  const pay = (id: number) => {
    api
      .payOrder(id)
      .then(() => {
        Taro.showToast({ title: '支付成功', icon: 'success' })
        load()
      })
      .catch((err: Error) => Taro.showToast({ title: err.message, icon: 'none' }))
  }

  const cancel = (id: number) => {
    api
      .cancelOrder(id)
      .then(() => {
        Taro.showToast({ title: '已取消', icon: 'success' })
        load()
      })
      .catch((err: Error) => Taro.showToast({ title: err.message, icon: 'none' }))
  }

  const receive = (id: number) => {
    api
      .receiveOrder(id)
      .then(() => {
        Taro.showToast({ title: '已确认收货', icon: 'success' })
        load()
      })
      .catch((err: Error) => Taro.showToast({ title: err.message, icon: 'none' }))
  }

  const hasAfterSale = (order: Order) =>
    order.afterSales?.some((a: any) => !['REFUNDED', 'CLOSED', 'ADMIN_REJECT', 'SHOP_REFUSED'].includes(a.status))

  const statusLabel = (order: Order) =>
    hasAfterSale(order) ? '售后中' : ORDER_STATUS_LABELS[order.status] || order.status

  const openDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${id}` })
  }

  return (
    <View className='orders'>
      <View className='orders__head'>
        <Text className='orders__title'>我的订单</Text>
      </View>

      <View className='filter-bar'>
        {FILTERS.map((f) => (
          <View
            key={f.key}
            className={`filter-pill ${filter === f.key ? 'filter-pill--active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            <Text>{f.label}</Text>
          </View>
        ))}
      </View>

      {loading ? (
        <View className='skeleton-list' />
      ) : orders.length === 0 ? (
        <View className='orders__empty'>
          <Text className='orders__empty-icon'>📋</Text>
          <Text className='orders__empty-text'>暂无订单</Text>
        </View>
      ) : (
        <ScrollView scrollY className='orders__list'>
          {orders.map((order) => (
            <View key={order.id} className='order-card' onClick={() => openDetail(order.id)}>
              <View className='order-card__head'>
                <Text className='order-card__no'>{order.orderNo}</Text>
                <Text className='order-card__status'>
                  {statusLabel(order)}
                </Text>
              </View>

              <View className='order-card__items'>
                {order.items?.map((item) => (
                  <View key={item.id} className='order-item'>
                    <Text className='order-item__name' numberOfLines={1}>{item.productName} x{item.quantity}</Text>
                    <Text className='order-item__price'>¥{formatPrice(item.subtotal)}</Text>
                  </View>
                ))}
              </View>

              <View className='order-card__foot'>
                <Text className='order-card__time'>{formatTime(order.createdAt)}</Text>
                <Text className='order-card__total'>合计 ¥{formatPrice(order.totalAmount)}</Text>
              </View>

              {order.status === 'PENDING_PAYMENT' && (
                <View className='order-card__actions'>
                  <View className='btn btn--ghost' onClick={() => cancel(order.id)}>
                    <Text>取消</Text>
                  </View>
                  <View className='btn btn--primary' onClick={() => pay(order.id)}>
                    <Text>去支付</Text>
                  </View>
                </View>
              )}
              {order.status === 'SHIPPED' && (
                <View className='order-card__actions'>
                  <View className='btn btn--primary' onClick={() => receive(order.id)}>
                    <Text>确认收货</Text>
                  </View>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}
