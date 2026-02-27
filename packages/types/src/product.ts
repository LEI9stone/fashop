export type ProductStatus = 'ON_SALE' | 'OFF_SALE'

export interface Sku {
  id: string
  productId: string
  specs: Record<string, string>  // { "颜色": "红色", "尺寸": "XL" }
  price: number                  // 单位：分
  stock: number
}

export interface Product {
  id: string
  sellerId: string
  name: string
  cover: string
  images: string[]
  detail: string
  status: ProductStatus
  skus: Sku[]
  createdAt: string
}

export interface ProductListItem {
  id: string
  name: string
  cover: string
  minPrice: number   // 最低价，单位：分
  maxPrice: number   // 最高价，单位：分
  status: ProductStatus
}

// 创建商品
export interface CreateProductDto {
  name: string
  cover: string
  images: string[]
  detail: string
  skus: Array<{
    specs: Record<string, string>
    price: number
    stock: number
  }>
}

// 更新商品
export type UpdateProductDto = Partial<CreateProductDto> & {
  status?: ProductStatus
}
