export type OrderStatus =
  | 'PENDING_PAY'    // 待付款
  | 'PENDING_SHIP'   // 待发货
  | 'SHIPPED'        // 已发货
  | 'DONE'           // 已完成
  | 'CANCELLED'      // 已取消
  | 'REFUNDING'      // 退款中
  | 'REFUNDED'       // 已退款

export interface OrderAddress {
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
}

export interface OrderItem {
  id: string
  orderId: string
  skuId: string
  name: string                      // 快照商品名
  cover: string                     // 快照商品图
  specs: Record<string, string>     // 快照规格
  price: number                     // 单位：分
  quantity: number
}

export interface Order {
  id: string
  userId: string
  sellerId: string
  status: OrderStatus
  items: OrderItem[]
  address: OrderAddress             // 快照收货地址
  totalAmount: number               // 单位：分
  remark?: string
  payAt?: string
  shipAt?: string
  trackingNo?: string
  trackingCompany?: string
  createdAt: string
}

// 创建订单
export interface CreateOrderDto {
  items: Array<{
    skuId: string
    quantity: number
  }>
  addressId: string
  couponId?: string
  remark?: string
}

// 发货
export interface ShipOrderDto {
  trackingNo: string
  trackingCompany: string
}
