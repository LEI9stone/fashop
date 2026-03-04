import Taro from '@tarojs/taro'
import { STORE_KEY, getLocalSync, setLocalSync, removeLocalSync } from './local-storage'

const API_BASE = process.env.TARO_APP_API_BASE || ''

interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

interface RequestOptions {
  url: string
  method?: keyof Taro.request.Method
  data?: Record<string, any>
  header?: Record<string, string>
}

function getToken(): string {
  return getLocalSync<string>(STORE_KEY.TOKEN) || ''
}

export function setToken(token: string) {
  setLocalSync(STORE_KEY.TOKEN, token)
}

export function removeToken() {
  removeLocalSync(STORE_KEY.TOKEN)
}

function filterParams(data?: Record<string, any>): Record<string, any> | undefined {
  if (!data) return undefined
  const result: Record<string, any> = {}
  for (const key of Object.keys(data)) {
    const val = data[key]
    if (val === null || val === undefined || val === '') continue
    result[key] = val
  }
  return result
}

function handleAuthFail() {
  removeToken()
  const pages = Taro.getCurrentPages()
  const current = pages[pages.length - 1]
  if (current?.route !== 'pages/login/index') {
    Taro.redirectTo({ url: '/pages/login/index' })
  }
}

export function request<T = any>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, header } = options

  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...header,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return new Promise<T>((resolve, reject) => {
    Taro.request<ApiResponse<T>>({
      url: `${API_BASE}${url}`,
      method,
      data: filterParams(data),
      header: headers,
      success(res) {
        const { statusCode, data: body } = res

        if (statusCode >= 200 && statusCode < 300) {
          return resolve(body.data)
        }

        if (statusCode === 401) {
          Taro.showToast({ title: body.message || '请先登录', icon: 'none' })
          handleAuthFail()
          return reject(body)
        }

        if (statusCode === 400) {
          Taro.showToast({ title: body.message || '参数错误', icon: 'none' })
          return reject(body)
        }

        if (statusCode >= 400 && statusCode < 500) {
          Taro.showToast({ title: body.message || '请求错误', icon: 'none' })
          return reject(body)
        }

        if (statusCode >= 500) {
          Taro.showToast({ title: '服务器异常，请稍后重试', icon: 'none' })
          return reject(body)
        }

        reject(body)
      },
      fail(err) {
        Taro.showToast({ title: '网络异常，请检查网络', icon: 'none' })
        reject(err)
      },
    })
  })
}

export const get = <T = any>(url: string, data?: Record<string, any>) =>
  request<T>({ url, method: 'GET', data })

export const post = <T = any>(url: string, data?: Record<string, any>) =>
  request<T>({ url, method: 'POST', data })

export const put = <T = any>(url: string, data?: Record<string, any>) =>
  request<T>({ url, method: 'PUT', data })

export const del = <T = any>(url: string, data?: Record<string, any>) =>
  request<T>({ url, method: 'DELETE', data })
