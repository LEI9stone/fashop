import type { Product, ProductListItem, PaginationResult } from '@fashop/types'
import { http } from './client'

export const productApi = {
  list: (params?: { page?: number; pageSize?: number; keyword?: string }) =>
    http.get<PaginationResult<ProductListItem>>('/products', params as any),

  detail: (id: string) =>
    http.get<Product>(`/products/${id}`),
}
