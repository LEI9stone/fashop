import { create } from 'zustand'
import { http } from '../api/client'

interface CartItem {
  skuId: string
  quantity: number
  price: number
  stock: number
  specs: Record<string, string>
  product: { id: string; name: string; cover: string }
}

interface CartStore {
  items: CartItem[]
  loading: boolean
  fetchCart: () => Promise<void>
  addItem: (skuId: string, quantity?: number) => Promise<void>
  updateItem: (skuId: string, quantity: number) => Promise<void>
  removeItem: (skuId: string) => Promise<void>
  totalCount: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  loading: false,

  fetchCart: async () => {
    set({ loading: true })
    const items = await http.get<CartItem[]>('/cart')
    set({ items, loading: false })
  },

  addItem: async (skuId, quantity = 1) => {
    await http.post('/cart/add', { skuId, quantity })
    await get().fetchCart()
  },

  updateItem: async (skuId, quantity) => {
    await http.patch('/cart/update', { skuId, quantity })
    if (quantity === 0) {
      set(state => ({ items: state.items.filter(i => i.skuId !== skuId) }))
    } else {
      set(state => ({ items: state.items.map(i => i.skuId === skuId ? { ...i, quantity } : i) }))
    }
  },

  removeItem: async (skuId) => {
    await http.delete(`/cart/${skuId}`)
    set(state => ({ items: state.items.filter(i => i.skuId !== skuId) }))
  },

  totalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}))
