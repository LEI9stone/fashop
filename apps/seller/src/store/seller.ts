import { create } from 'zustand'
import Taro from '@tarojs/taro'
import type { Seller } from '@fashop/types'

interface SellerStore {
  seller: Seller | null
  token: string | null
  setAuth: (seller: Seller, token: string) => void
  logout: () => void
  isLoggedIn: () => boolean
}

export const useSellerStore = create<SellerStore>((set, get) => ({
  seller: null,
  token: Taro.getStorageSync('seller_token') || null,

  setAuth: (seller, token) => {
    Taro.setStorageSync('seller_token', token)
    set({ seller, token })
  },

  logout: () => {
    Taro.removeStorageSync('seller_token')
    set({ seller: null, token: null })
    Taro.redirectTo({ url: '/pages/auth/index' })
  },

  isLoggedIn: () => !!get().token,
}))
