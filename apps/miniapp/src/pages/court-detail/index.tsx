import { useEffect, useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Textarea, Input, Image } from '@tarojs/components'
import { api } from '@/api'
import { API_BASE } from '@/api/request'
import { requireLogin } from '@/utils/auth'
import './index.scss'

const STATUS_LABELS: Record<string, string> = {
  JUDGING: '投票中',
  ADMIN_REVIEW: '管理员复核中',
  CLOSED_BUYER_WIN: '买家胜诉',
  CLOSED_SHOP_WIN: '商家胜诉',
  ADMIN_REFUND: '管理员判定退款',
  ADMIN_REJECT: '管理员判定驳回',
  ADMIN_PARTIAL: '管理员判定部分退款',
  CANCELLED: '已撤销',
}

export default function CourtDetailPage() {
  const router = useRouter()
  const id = Number(router.params.id)
  const [c, setC] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [side, setSide] = useState<'buyer' | 'shop'>('buyer')
  const [comment, setComment] = useState('')
  const [statement, setStatement] = useState('')
  const [rebuttal, setRebuttal] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  const load = () => {
    if (!requireLogin()) {
      setLoading(false)
      return
    }
    api
      .courtDetail(id)
      .then((res) => setC(res))
      .catch((err: Error) => Taro.showToast({ title: err.message, icon: 'none' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [id])

  const submitVote = () => {
    setBusy(true)
    api
      .courtVote(id, side, comment)
      .then(() => {
        Taro.showToast({ title: '投票成功', icon: 'success' })
        load()
      })
      .catch((err: Error) => Taro.showToast({ title: err.message, icon: 'none' }))
      .finally(() => setBusy(false))
  }

  const chooseImages = async (): Promise<string[]> => {
    const res = await Taro.chooseImage({ count: 3, sizeType: ['compressed'] })
    const token = Taro.getStorageSync<string>('token')
    const urls: string[] = []
    for (const filePath of res.tempFilePaths) {
      const upload = await Taro.uploadFile({
        url: `${API_BASE}/api/upload`,
        filePath,
        name: 'file',
        header: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = JSON.parse(upload.data || '{}')
      if (data.url) urls.push(data.url)
    }
    return urls
  }

  const submitEvidence = async (isRebuttal: boolean) => {
    if (!isRebuttal && !statement.trim()) {
      Taro.showToast({ title: '请填写陈述', icon: 'none' })
      return
    }
    if (isRebuttal && !rebuttal.trim()) {
      Taro.showToast({ title: '请填写反驳内容', icon: 'none' })
      return
    }
    setBusy(true)
    try {
      const payload: Record<string, unknown> = isRebuttal
        ? { rebuttal: true, content: rebuttal }
        : { statement, images }
      await api.courtEvidence(id, payload)
      Taro.showToast({ title: '已提交', icon: 'success' })
      setStatement('')
      setRebuttal('')
      setImages([])
      load()
    } catch (err: any) {
      Taro.showToast({ title: err.message, icon: 'none' })
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <View className='court-detail'>
        <View className='skeleton-detail' />
      </View>
    )
  }
  if (!c) {
    return (
      <View className='court-detail__empty'>
        <Text>案件不存在</Text>
      </View>
    )
  }

  const parseImages = (s: string) => {
    try {
      return JSON.parse(s || '[]')
    } catch {
      return []
    }
  }

  return (
    <View className='court-detail'>
      <View className='court-detail__head'>
        <View>
          <Text className='court-detail__title'>案件 {c.caseNo}</Text>
          <Text className='court-detail__meta'>售后金额 ¥{c.afterSale?.amount} · 店铺 {c.shop?.name}</Text>
        </View>
        <Text className='court-detail__status'>{STATUS_LABELS[c.status] || c.status}</Text>
      </View>

      <View className='evidence-block'>
        <Text className='evidence-block__title'>买家陈述</Text>
        <Text className='evidence-block__text'>{c.buyerStatement || '暂未提交'}</Text>
        <View className='evidence-block__images'>
          {parseImages(c.buyerEvidence).map((u: string, i: number) => (
            <Image key={i} src={u} mode='aspectFill' className='evidence-block__img' />
          ))}
        </View>
        {c.buyerRebuttal ? <Text className='evidence-block__rebuttal'>反驳：{c.buyerRebuttal}</Text> : null}
      </View>

      <View className='evidence-block'>
        <Text className='evidence-block__title'>商家陈述</Text>
        <Text className='evidence-block__text'>{c.shopStatement || '暂未提交'}</Text>
        <View className='evidence-block__images'>
          {parseImages(c.shopEvidence).map((u: string, i: number) => (
            <Image key={i} src={u} mode='aspectFill' className='evidence-block__img' />
          ))}
        </View>
        {c.shopRebuttal ? <Text className='evidence-block__rebuttal'>反驳：{c.shopRebuttal}</Text> : null}
      </View>

      <View className='vote-block'>
        <Text className='vote-block__title'>投票结果 · 买家 {c.buyerVotes} / 商家 {c.shopVotes}</Text>
        {c.votes?.map((v: any) => (
          <View key={v.id} className='vote-row'>
            <Text className='vote-row__name'>{v.user?.nickname || '匿名用户'}</Text>
            <Text className={`vote-row__side ${v.side === 'buyer' ? 'vote-row__side--buyer' : 'vote-row__side--shop'}`}>
              {v.side === 'buyer' ? '支持买家' : '支持商家'}
            </Text>
            {v.comment ? <Text className='vote-row__comment'>{v.comment}</Text> : null}
          </View>
        ))}
      </View>

      {c.status === 'JUDGING' && !c.myVote && c.canVote && (
        <View className='vote-form'>
          <View className='vote-form__sides'>
            <View className={`vote-form__side ${side === 'buyer' ? 'vote-form__side--buyer' : ''}`} onClick={() => setSide('buyer')}>
              <Text>支持买家</Text>
            </View>
            <View className={`vote-form__side ${side === 'shop' ? 'vote-form__side--shop' : ''}`} onClick={() => setSide('shop')}>
              <Text>支持商家</Text>
            </View>
          </View>
          <Textarea
            className='vote-form__comment'
            placeholder='写下你的判断理由（公开可见）'
            value={comment}
            onInput={(e) => setComment(e.detail.value)}
          />
          <View className='btn btn--primary' onClick={submitVote}>
            <Text>{busy ? '提交中...' : '提交投票'}</Text>
          </View>
        </View>
      )}

      {c.status === 'JUDGING' && !c.myVote && !c.canVote && (
        <View className='tip-box'>
          <Text>{c.voteReason || '当前账号没有投票资格'}</Text>
        </View>
      )}

      {c.canSubmitEvidence && (
        <View className='evidence-form'>
          <Text className='evidence-form__title'>提交陈述 / 证据</Text>
          <Textarea
            className='evidence-form__input'
            placeholder='填写你的陈述'
            value={statement}
            onInput={(e) => setStatement(e.detail.value)}
          />
          <View className='evidence-form__images'>
            {images.map((u, i) => (
              <Image key={i} src={u} mode='aspectFill' className='evidence-form__img' />
            ))}
            <View className='evidence-form__add' onClick={async () => setImages(await chooseImages())}>
              <Text>+ 图片</Text>
            </View>
          </View>
          <View className='btn btn--primary' onClick={() => submitEvidence(false)}>
            <Text>{busy ? '提交中...' : '提交陈述与证据'}</Text>
          </View>
          <Textarea
            className='evidence-form__input'
            placeholder='反驳对方（可选项）'
            value={rebuttal}
            onInput={(e) => setRebuttal(e.detail.value)}
          />
          <View className='btn btn--ghost' onClick={() => submitEvidence(true)}>
            <Text>{busy ? '提交中...' : '提交反驳'}</Text>
          </View>
        </View>
      )}
    </View>
  )
}
