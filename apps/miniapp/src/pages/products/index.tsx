import { useEffect, useState } from 'react'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { api, type ProductItem, type Category } from '@/api'
import ProductCard from '@/components/product-card'
import './index.scss'

const SORTS = [
  { key: '', label: '默认' },
  { key: 'sales', label: '销量' },
  { key: 'price_asc', label: '价格↑' },
  { key: 'price_desc', label: '价格↓' },
]

export default function ProductsPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryId, setCategoryId] = useState('')
  const [keyword, setKeyword] = useState('')
  const [sort, setSort] = useState('')

  const applyRoute = () => {
    const params = router.params
    if (params.categoryId) setCategoryId(params.categoryId)
    if (params.keyword) setKeyword(params.keyword)
    const query = Taro.getStorageSync<{ keyword?: string; categoryId?: string }>('product_query')
    if (query) {
      if (query.keyword !== undefined) setKeyword(query.keyword)
      if (query.categoryId !== undefined) setCategoryId(query.categoryId)
      Taro.removeStorageSync('product_query')
    }
  }

  useEffect(() => {
    applyRoute()
    api
      .categories()
      .then((res) => setCategories(Array.isArray(res) ? res : []))
      .catch(() => {})
  }, [])

  const load = () => {
    setLoading(true)
    const params: Record<string, unknown> = { pageSize: 20 }
    if (categoryId) params.categoryId = categoryId
    if (keyword) params.keyword = keyword
    if (sort) params.sort = sort
    api
      .products(params)
      .then((res) => setProducts(res.data || []))
      .catch(() => Taro.showToast({ title: '加载失败', icon: 'none' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [categoryId, keyword, sort])

  useDidShow(() => {
    applyRoute()
  })

  return (
    <View className='page'>
      <ScrollView scrollX className='cat-bar'>
        <View className='cat-list'>
          <View className={`cat-pill ${!categoryId ? 'cat-pill--active' : ''}`} onClick={() => setCategoryId('')}>
            <Text>全部</Text>
          </View>
          {categories.map((c) => (
            <View
              key={c.id}
              className={`cat-pill ${String(c.id) === categoryId ? 'cat-pill--active' : ''}`}
              onClick={() => setCategoryId(String(c.id))}
            >
              <Text>{c.name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {keyword && (
        <View className='result-tip'>
          <Text>“{keyword}” 的搜索结果</Text>
        </View>
      )}

      <View className='sort-bar'>
        {SORTS.map((s) => (
          <View
            key={s.key}
            className={`sort-pill ${sort === s.key ? 'sort-pill--active' : ''}`}
            onClick={() => setSort(s.key)}
          >
            <Text>{s.label}</Text>
          </View>
        ))}
      </View>

      {loading ? (
        <View className='grid'>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className='skeleton' />
          ))}
        </View>
      ) : products.length === 0 ? (
        <View className='empty'>
          <Text className='empty__icon'>📦</Text>
          <Text className='empty__text'>暂无商品</Text>
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
