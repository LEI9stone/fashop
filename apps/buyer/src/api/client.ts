import Taro from '@tarojs/taro'

const BASE_URL = process.env.TARO_APP_API_URL || 'http://localhost:3000/api'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  data?: Record<string, unknown>
  headers?: Record<string, string>
}

async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const token = Taro.getStorageSync('token')

  const response = await Taro.request({
    url: `${BASE_URL}${url}`,
    method: options.method || 'GET',
    data: options.data,
    header: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (response.statusCode === 401) {
    Taro.removeStorageSync('token')
    Taro.navigateTo({ url: '/pages/auth/index' })
    throw new Error('请先登录')
  }

  const result = response.data as { code: number; message: string; data: T }

  if (result.code !== 0) {
    Taro.showToast({ title: result.message, icon: 'none' })
    throw new Error(result.message)
  }

  return result.data
}

export const http = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    request<T>(url + (params ? '?' + new URLSearchParams(params as any).toString() : '')),
  post: <T>(url: string, data?: Record<string, unknown>) =>
    request<T>(url, { method: 'POST', data }),
  patch: <T>(url: string, data?: Record<string, unknown>) =>
    request<T>(url, { method: 'PATCH', data }),
  delete: <T>(url: string) =>
    request<T>(url, { method: 'DELETE' }),
}
