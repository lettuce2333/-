import { useEffect, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView, Input, Switch } from '@tarojs/components'
import { api, type Address } from '@/api'
import { requireLogin } from '@/utils/auth'
import './index.scss'

const emptyAddr = { receiver: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false }

export default function AddressPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyAddr)

  const load = () => {
    if (!requireLogin()) {
      setLoading(false)
      return
    }
    api
      .addresses()
      .then((res) => setAddresses(Array.isArray(res) ? res : []))
      .catch((err: any) => Taro.showToast({ title: err.message, icon: 'none' }))
      .finally(() => setLoading(false))
  }

  useDidShow(() => load())
  useEffect(() => load(), [])

  const save = async () => {
    try {
      await api.createAddress(form)
      setShowForm(false)
      setForm(emptyAddr)
      Taro.showToast({ title: '地址已添加', icon: 'success' })
      load()
    } catch (err: any) {
      Taro.showToast({ title: err.message, icon: 'none' })
    }
  }

  const remove = (id: number) => {
    Taro.showModal({
      title: '删除地址',
      content: '确定删除该收货地址吗？',
      success: (res) => {
        if (!res.confirm) return
        api.removeAddress(id)
          .then(() => {
            setAddresses(addresses.filter((a) => a.id !== id))
            Taro.showToast({ title: '已删除', icon: 'success' })
          })
          .catch((err: any) => Taro.showToast({ title: err.message, icon: 'none' }))
      },
    })
  }

  return (
    <View className='addr-page'>
      <View className='addr-page__head'>
        <Text className='addr-page__title'>收货地址</Text>
        <Text className='addr-page__add' onClick={() => setShowForm(!showForm)}>
          {showForm ? '收起' : '新增地址'}
        </Text>
      </View>

      <ScrollView scrollY className='addr-page__scroll'>
        {showForm && (
          <View className='addr-form'>
            <Input className='addr-form__input' placeholder='收货人' value={form.receiver} onInput={(e) => setForm({ ...form, receiver: e.detail.value })} />
            <Input className='addr-form__input' placeholder='手机号' value={form.phone} onInput={(e) => setForm({ ...form, phone: e.detail.value })} />
            <View className='addr-form__row'>
              <Input className='addr-form__input addr-form__input--third' placeholder='省' value={form.province} onInput={(e) => setForm({ ...form, province: e.detail.value })} />
              <Input className='addr-form__input addr-form__input--third' placeholder='市' value={form.city} onInput={(e) => setForm({ ...form, city: e.detail.value })} />
              <Input className='addr-form__input addr-form__input--third' placeholder='区' value={form.district} onInput={(e) => setForm({ ...form, district: e.detail.value })} />
            </View>
            <Input className='addr-form__input' placeholder='详细地址' value={form.detail} onInput={(e) => setForm({ ...form, detail: e.detail.value })} />
            <View className='addr-form__default'>
              <Text className='addr-form__label'>设为默认地址</Text>
              <Switch checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.detail.value })} color='#b91c1c' />
            </View>
            <View className='addr-form__save' onClick={save}>
              <Text>保存地址</Text>
            </View>
          </View>
        )}

        {loading ? (
          <View className='skeleton-list' />
        ) : addresses.length === 0 ? (
          <View className='addr-page__empty'>
            <Text className='addr-page__empty-icon'>📍</Text>
            <Text className='addr-page__empty-text'>暂无收货地址</Text>
          </View>
        ) : (
          addresses.map((addr) => (
            <View key={addr.id} className='addr-card'>
              <View className='addr-card__body'>
                <Text className='addr-card__name'>{addr.receiver} {addr.phone}</Text>
                <Text className='addr-card__detail'>{addr.province}{addr.city}{addr.district}{addr.detail}</Text>
                {addr.isDefault && <Text className='addr-card__tag'>默认</Text>}
              </View>
              <Text className='addr-card__remove' onClick={() => remove(addr.id)}>删除</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}
