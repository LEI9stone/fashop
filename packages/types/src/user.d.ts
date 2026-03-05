declare namespace User {
  interface Info {
    id: string
    phone: string
    nickname: string
    avatar?: string
    createdAt: string
  }

  interface Profile {
    id: string
    nickname: string
    avatar: string | null
  }

  interface OAuth {
    id: string
    userId: string
    platform: 'weapp' | 'tt'
    openid: string
    unionid?: string
  }

  interface Seller {
    id: string
    phone: string
    shopName: string
    logo?: string
    description?: string
    createdAt: string
  }
}
