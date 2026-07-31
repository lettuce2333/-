import { useEffect, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import { api, type ProductItem } from '@/api'
import ProductCard from '@/components/product-card'
import './index.scss'

export default function IndexPage() {
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')

  const load = () => {
    setLoading(true)
    api
      .products({ pageSize: 10 })
      .then((res) => setProducts(res.data || []))
      .catch(() => Taro.showToast({ title: '加载失败', icon: 'none' }))
      .finally(() => setLoading(false))
  }

  useDidShow(() => {
    load()
  })

  useEffect(() => {
    load()
  }, [])

  const search = () => {
    Taro.setStorageSync('product_query', { keyword, categoryId: '' })
    Taro.switchTab({ url: '/pages/products/index' })
  }

  const goProducts = (categoryId?: number) => {
    Taro.setStorageSync('product_query', { keyword: '', categoryId: categoryId ? String(categoryId) : '' })
    Taro.switchTab({ url: '/pages/products/index' })
  }

  return (
    <View className='page'>
      <View className='hero'>
        <Text className='hero__title'>品质生活 从这里开始</Text>
        <Text className='hero__subtitle'>正品保障 · 极速物流 · 无忧售后</Text>
      </View>

      <View className='search'>
        <Input
          className='search__input'
          placeholder='搜索商品'
          value={keyword}
          onInput={(e) => setKeyword(e.detail.value)}
          confirmType='search'
          onConfirm={search}
        />
        <View className='search__btn' onClick={search}>
          <Text>搜索</Text>
        </View>
      </View>

      <View className='cats'>
        <View className='cat-item' onClick={() => goProducts(1)}>
          <Text className='cat-item__name'>手机数码</Text>
        </View>
        <View className='cat-item' onClick={() => goProducts(2)}>
          <Text className='cat-item__name'>电脑办公</Text>
        </View>
        <View className='cat-item' onClick={() => goProducts(3)}>
          <Text className='cat-item__name'>家用电器</Text>
        </View>
        <View className='cat-item' onClick={() => goProducts()}>
          <Text className='cat-item__name'>全部商品</Text>
        </View>
      </View>

      <View className='section-head'>
        <Text className='section-head__title'>推荐商品</Text>
      </View>

      {loading ? (
        <View className='grid'>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className='skeleton' />
          ))}
        </View>
      ) : (
        <ScrollView scrollY className='grid-wrap'>
          <View className='grid'>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  )
}
