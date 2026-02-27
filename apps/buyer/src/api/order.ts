import type { Order, CreateOrderDto, PaginationResult, OrderStatus } from '@fashop/types'
import { http } from './client'

export const orderApi = {
  create: (dto: CreateOrderDto) =>
    http.post<Order>('/orders', dto as any),

  list: (params?: { status?: OrderStatus; page?: number; pageSize?: number }) =>
    http.get<PaginationResult<Order>>('/orders', params as any),

  detail: (id: string) =>
    http.get<Order>(`/orders/${id}`),
}
