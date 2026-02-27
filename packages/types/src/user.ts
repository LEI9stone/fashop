export interface User {
  id: string
  phone: string
  nickname: string
  avatar?: string
  createdAt: string
}

export interface UserOAuth {
  id: string
  userId: string
  platform: 'weapp' | 'tt'
  openid: string
  unionid?: string
}

export interface Seller {
  id: string
  phone: string
  shopName: string
  logo?: string
  description?: string
  createdAt: string
}
