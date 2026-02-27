// 统一 API 响应格式
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// 分页请求参数
export interface PaginationQuery {
  page?: number
  pageSize?: number
}

// 分页响应
export interface PaginationResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// 地址
export interface Address {
  id: string
  userId: string
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault: boolean
}
