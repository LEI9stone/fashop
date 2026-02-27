export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/category/index',
    'pages/cart/index',
    'pages/user/index',
  ],
  subPackages: [
    {
      root: 'pages/product',
      pages: ['list/index', 'detail/index'],
    },
    {
      root: 'pages/order',
      pages: ['list/index', 'detail/index'],
    },
    {
      root: 'pages/checkout',
      pages: ['index'],
    },
    {
      root: 'pages/address',
      pages: ['list/index', 'edit/index'],
    },
    {
      root: 'pages/auth',
      pages: ['index'],
    },
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#999',
    selectedColor: '#ff4d4f',
    backgroundColor: '#fff',
    borderStyle: 'black',
    list: [
      { pagePath: 'pages/home/index', text: '首页', iconPath: 'assets/tab/home.png', selectedIconPath: 'assets/tab/home-active.png' },
      { pagePath: 'pages/category/index', text: '分类', iconPath: 'assets/tab/category.png', selectedIconPath: 'assets/tab/category-active.png' },
      { pagePath: 'pages/cart/index', text: '购物车', iconPath: 'assets/tab/cart.png', selectedIconPath: 'assets/tab/cart-active.png' },
      { pagePath: 'pages/user/index', text: '我的', iconPath: 'assets/tab/user.png', selectedIconPath: 'assets/tab/user-active.png' },
    ],
  },
})
