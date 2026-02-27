export default defineAppConfig({
  pages: [
    'pages/auth/index',
    'pages/dashboard/index',
    'pages/order/list/index',
    'pages/order/detail/index',
    'pages/product/list/index',
    'pages/product/edit/index',
    'pages/product/stock/index',
    'pages/shop/settings/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '商家管理',
    navigationBarTextStyle: 'black',
  },
})
