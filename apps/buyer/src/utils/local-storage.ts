import Taro from '@tarojs/taro'

export enum STORE_KEY {
  TOKEN = 'token',
}

const EXPIRE_MS = 30 * 24 * 60 * 60 * 1000

interface StoreValue<T = any> {
  data: T
  time: number
}

function isExpired(time: number): boolean {
  return Date.now() - time > EXPIRE_MS
}

// ======================== 同步操作 ========================

export function getLocalSync<T = any>(key: STORE_KEY): T | null {
  const raw = Taro.getStorageSync(key)
  if (!raw) return null
  const store = JSON.parse(raw) as StoreValue<T>
  if (isExpired(store.time)) {
    Taro.removeStorageSync(key)
    return null
  }
  return store.data
}

export function setLocalSync<T = any>(key: STORE_KEY, value: T): void {
  const store: StoreValue<T> = { data: value, time: Date.now() }
  Taro.setStorageSync(key, JSON.stringify(store))
}

export function removeLocalSync(key: STORE_KEY): void {
  Taro.removeStorageSync(key)
}

// ======================== 异步操作 ========================

export async function getLocal<T = any>(key: STORE_KEY): Promise<T | null> {
  try {
    const res = await Taro.getStorage({ key })
    const store = JSON.parse(res.data) as StoreValue<T>
    if (isExpired(store.time)) {
      await Taro.removeStorage({ key })
      return null
    }
    return store.data
  } catch {
    return null
  }
}

export async function setLocal<T = any>(key: STORE_KEY, value: T): Promise<void> {
  const store: StoreValue<T> = { data: value, time: Date.now() }
  await Taro.setStorage({ key, data: JSON.stringify(store) })
}

export async function removeLocal(key: STORE_KEY): Promise<void> {
  await Taro.removeStorage({ key })
}
