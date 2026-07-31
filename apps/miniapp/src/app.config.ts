export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/products/index',
    'pages/product-detail/index',
    'pages/login/index',
    'pages/cart/index',
    'pages/checkout/index',
    'pages/orders/index',
    'pages/mine/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#b91c1c',
    navigationBarTitleText: '优品商城',
    navigationBarTextStyle: 'white',
  },
  tabBar: {
    color: '#8a8580',
    selectedColor: '#b91c1c',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
      },
      {
        pagePath: 'pages/products/index',
        text: '分类',
      },
      {
        pagePath: 'pages/cart/index',
        text: '购物车',
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
      },
    ],
  },
})
