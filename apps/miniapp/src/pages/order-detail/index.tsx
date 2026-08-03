import { useEffect, useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, ScrollView, Input, Textarea } from '@tarojs/components'
import { api, type OrderDetail } from '@/api'
import { formatPrice, formatTime } from '@/utils/format'
import { ORDER_STATUS_LABELS } from '@/constants'
import { requireLogin } from '@/utils/auth'
import './index.scss'

export default function OrderDetailPage() {
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReview, setShowReview] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewContent, setReviewContent] = useState('')
  const [showAfterSale, setShowAfterSale] = useState(false)
  const [afterAmount, setAfterAmount] = useState('')
  const [afterReason, setAfterReason] = useState('')

  const id = Number(router.params.id)

  const load = () => {
    if (!requireLogin()) return
    api
      .order(id)
      .then(setOrder)
      .catch((err: any) => Taro.showToast({ title: err.message, icon: 'none' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (id) load()
  }, [id])

  const pay = () => {
    api.payOrder(id).then(() => {
      Taro.showToast({ title: '支付成功', icon: 'success' })
      load()
    }).catch((err: any) => Taro.showToast({ title: err.message, icon: 'none' }))
  }

  const cancel = () => {
    api.cancelOrder(id).then(() => {
      Taro.showToast({ title: '已取消', icon: 'success' })
      load()
    }).catch((err: any) => Taro.showToast({ title: err.message, icon: 'none' }))
  }

  const receive = () => {
    api.receiveOrder(id).then(() => {
      Taro.showToast({ title: '已确认收货', icon: 'success' })
      load()
    }).catch((err: any) => Taro.showToast({ title: err.message, icon: 'none' }))
  }

  const submitReview = () => {
    const item = order?.items?.[0]
    if (!item) return
    if (!reviewContent.trim()) {
      Taro.showToast({ title: '请输入评价内容', icon: 'none' })
      return
    }
    api.createReview({ orderId: order!.id, productId: item.productId, rating: reviewRating, content: reviewContent })
      .then(() => {
        Taro.showToast({ title: '评价成功', icon: 'success' })
        setShowReview(false)
        setReviewContent('')
      })
      .catch((err: any) => Taro.showToast({ title: err.message, icon: 'none' }))
  }

  const submitAfterSale = () => {
    if (!afterReason.trim()) {
      Taro.showToast({ title: '请填写申请原因', icon: 'none' })
      return
    }
    api.createAfterSale({
      orderId: order!.id,
      type: 'refund_only',
      reason: afterReason,
      amount: Number(afterAmount) || order!.totalAmount,
    })
      .then(() => {
        Taro.showToast({ title: '售后申请已提交', icon: 'success' })
        setShowAfterSale(false)
        setAfterReason('')
      })
      .catch((err: any) => Taro.showToast({ title: err.message, icon: 'none' }))
  }

  const openCourt = (afterSaleId: number) => {
    api.openCourt(afterSaleId)
      .then(() => {
        Taro.showToast({ title: '小法庭已开启', icon: 'success' })
        load()
      })
      .catch((err: any) => Taro.showToast({ title: err.message, icon: 'none' }))
  }

  if (loading) {
    return <View className='detail-page'><View className='skeleton' /></View>
  }

  if (!order) {
    return (
      <View className='detail-page detail-page--empty'>
        <Text>订单不存在</Text>
      </View>
    )
  }

  const hasAfterSale = order.afterSales?.some((a: any) => !['REFUNDED', 'CLOSED', 'ADMIN_REJECT', 'SHOP_REFUSED'].includes(a.status))
  const refusedAfterSale = order.afterSales?.find((a: any) => a.status === 'SHOP_REFUSED')
  const courtAfterSale = order.afterSales?.find((a: any) => a.status === 'COURT_JUDGING' || a.status === 'COURT_ADMIN_REVIEW')
  const statusText = hasAfterSale ? '售后中' : ORDER_STATUS_LABELS[order.status] || order.status

  return (
    <View className='detail-page'>
      <ScrollView scrollY className='detail-page__scroll'>
        <View className='panel status-panel'>
          <Text className='status-panel__title'>{statusText}</Text>
          <Text className='status-panel__no'>{order.orderNo}</Text>
        </View>

        <View className='panel'>
          <Text className='panel__title'>收货信息</Text>
          <Text className='panel__line'>{order.receiverName} {order.receiverPhone}</Text>
          <Text className='panel__line panel__line--muted'>{order.receiverAddress}</Text>
        </View>

        <View className='panel'>
          <Text className='panel__title'>商品信息</Text>
          {order.items?.map((item) => (
            <View key={item.id} className='item'>
              <View className='item__body'>
                <Text className='item__name' numberOfLines={1}>{item.productName}</Text>
                <Text className='item__specs'>{item.skuSpecs || ''} x{item.quantity}</Text>
              </View>
              <Text className='item__price'>¥{formatPrice(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        {order.logistics && (
          <View className='panel'>
            <Text className='panel__title'>物流信息</Text>
            <Text className='panel__line'>快递公司：{order.logistics.company}</Text>
            <Text className='panel__line'>运单号：{order.logistics.trackingNo}</Text>
          </View>
        )}

        <View className='panel'>
          <Text className='panel__title'>订单信息</Text>
          <Text className='panel__line'>下单时间：{formatTime(order.createdAt)}</Text>
          {order.paidAt && <Text className='panel__line'>付款时间：{formatTime(order.paidAt)}</Text>}
          {order.shippedAt && <Text className='panel__line'>发货时间：{formatTime(order.shippedAt)}</Text>}
          <Text className='panel__total'>合计：¥{formatPrice(order.totalAmount)}</Text>
        </View>

        {showReview && (
          <View className='panel form-panel'>
            <Text className='panel__title'>评价商品</Text>
            <View className='stars'>
              {[1, 2, 3, 4, 5].map((s) => (
                <Text
                  key={s}
                  className={`stars__item ${s <= reviewRating ? 'stars__item--on' : ''}`}
                  onClick={() => setReviewRating(s)}
                >
                  ★
                </Text>
              ))}
            </View>
            <Textarea
              className='form-panel__textarea'
              placeholder='分享您的使用体验...'
              value={reviewContent}
              onInput={(e) => setReviewContent(e.detail.value)}
              maxlength={500}
            />
            <View className='form-panel__save' onClick={submitReview}>
              <Text>提交评价</Text>
            </View>
          </View>
        )}

        {showAfterSale && (
          <View className='panel form-panel'>
            <Text className='panel__title'>申请售后</Text>
            <Input className='form-panel__input' type='digit' placeholder='退款金额' value={afterAmount} onInput={(e) => setAfterAmount(e.detail.value)} />
            <Textarea className='form-panel__textarea' placeholder='请描述退款原因' value={afterReason} onInput={(e) => setAfterReason(e.detail.value)} maxlength={200} />
            <View className='form-panel__save' onClick={submitAfterSale}>
              <Text>提交申请</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View className='action-bar'>
        {order.status === 'PENDING_PAYMENT' && (
          <>
            <View className='action-bar__btn action-bar__btn--ghost' onClick={cancel}><Text>取消</Text></View>
            <View className='action-bar__btn action-bar__btn--primary' onClick={pay}><Text>去支付</Text></View>
          </>
        )}
        {order.status === 'SHIPPED' && (
          <View className='action-bar__btn action-bar__btn--primary' onClick={receive}><Text>确认收货</Text></View>
        )}
        {(order.status === 'RECEIVED' || order.status === 'COMPLETED') && (
          <View className='action-bar__btn action-bar__btn--ghost' onClick={() => setShowReview(!showReview)}><Text>{showReview ? '收起评价' : '评价'}</Text></View>
        )}
        {refusedAfterSale && (
          <View className='action-bar__btn action-bar__btn--primary' onClick={() => openCourt(refusedAfterSale.id)}><Text>开启小法庭</Text></View>
        )}
        {courtAfterSale?.courtCase && (
          <View className='action-bar__btn action-bar__btn--ghost' onClick={() => Taro.navigateTo({ url: `/pages/court-detail/index?id=${courtAfterSale.courtCase.id}` })}><Text>查看小法庭</Text></View>
        )}
        {order.status === 'RECEIVED' && !hasAfterSale && !refusedAfterSale && (
          <View className='action-bar__btn action-bar__btn--ghost' onClick={() => setShowAfterSale(!showAfterSale)}><Text>{showAfterSale ? '收起售后' : '申请售后'}</Text></View>
        )}
      </View>
    </View>
  )
}
