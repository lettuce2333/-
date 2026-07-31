import Taro from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import { fullImage, formatPrice, parseImages } from '@/utils/format'
import type { ProductItem } from '@/api'
import './index.scss'

interface Props {
  product: ProductItem
}

export default function ProductCard({ product }: Props) {
  const images = parseImages(product.images)
  const cover = images[0]

  const goDetail = () => {
    Taro.navigateTo({ url: `/pages/product-detail/index?id=${product.id}` })
  }

  return (
    <View className='product-card' onClick={goDetail}>
      <View className='product-card__cover'>
        {cover ? (
          <Image className='product-card__image' src={fullImage(cover)} mode='aspectFill' />
        ) : (
          <Text className='product-card__placeholder'>📦</Text>
        )}
      </View>
      <View className='product-card__body'>
        <Text className='product-card__name' numberOfLines={2}>{product.name}</Text>
        <View className='product-card__footer'>
          <Text className='product-card__price'>
            <Text className='product-card__symbol'>¥</Text>
            {formatPrice(product.price)}
          </Text>
          <Text className='product-card__sales'>已售 {product.sales}</Text>
        </View>
      </View>
    </View>
  )
}
