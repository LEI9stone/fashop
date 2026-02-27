import { create } from 'zustand'
import Taro from '@tarojs/taro'
import type { User } from '@fashop/types'

interface UserStore {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
  isLoggedIn: () => boolean
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  token: Taro.getStorageSync('token') || null,

  setAuth: (user, token) => {
    Taro.setStorageSync('token', token)
    set({ user, token })
  },

  logout: () => {
    Taro.removeStorageSync('token')
    set({ user: null, token: null })
  },

  isLoggedIn: () => !!get().token,
}))
