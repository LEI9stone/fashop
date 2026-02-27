import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { userAuth, sellerAuth } from '../middlewares/auth.js'

export const orderRoutes = new Hono()

// ─── 买家接口 ──────────────────────────────────────────────────────────────────

// 创建订单
orderRoutes.post('/', userAuth,
  zValidator('json', z.object({
    items: z.array(z.object({
      skuId: z.string(),
      quantity: z.number().int().positive(),
    })).min(1),
    addressId: z.string(),
    remark: z.string().optional(),
  })),
  async (c) => {
    const userId = c.get('jwtPayload').sub
    const { items, addressId, remark } = c.req.valid('json')

    // 查询 SKU 和地址
    const [skus, address] = await Promise.all([
      prisma.sku.findMany({
        where: { id: { in: items.map(i => i.skuId) } },
        include: { product: true },
      }),
      prisma.address.findFirst({ where: { id: addressId, userId } }),
    ])

    if (!address) return c.json({ code: 400, message: '收货地址不存在' }, 400)

    // 验证库存并计算总价
    for (const item of items) {
      const sku = skus.find((s) => s.id === item.skuId)
      if (!sku) return c.json({ code: 400, message: '商品不存在' }, 400)
      if (sku.stock < item.quantity) return c.json({ code: 400, message: `${sku.product.name} 库存不足` }, 400)
    }

    const totalAmount = items.reduce((sum, item) => {
      const sku = skus.find((s) => s.id === item.skuId)!
      return sum + sku.price * item.quantity
    }, 0)

    const sellerId = skus[0].product.sellerId

    // 事务：扣库存 + 创建订单
    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const item of items) {
        await tx.sku.update({
          where: { id: item.skuId },
          data: { stock: { decrement: item.quantity } },
        })
      }

      return tx.order.create({
        data: {
          userId,
          sellerId,
          totalAmount,
          remark,
          address: {
            name: address.name,
            phone: address.phone,
            province: address.province,
            city: address.city,
            district: address.district,
            detail: address.detail,
          },
          items: {
            create: items.map((item) => {
              const sku = skus.find((s) => s.id === item.skuId)!
              return {
                skuId: item.skuId,
                name: sku.product.name,
                cover: sku.product.cover,
                specs: sku.specs as Record<string, string>,
                price: sku.price,
                quantity: item.quantity,
              }
            }),
          },
        },
        include: { items: true },
      })
    })

    return c.json({ code: 0, message: '下单成功', data: order }, 201)
  }
)

// 买家订单列表
orderRoutes.get('/', userAuth, async (c) => {
  const userId = c.get('jwtPayload').sub
  const { status, page = '1', pageSize = '10' } = c.req.query()

  const where = {
    userId,
    ...(status ? { status: status as any } : {}),
  }

  const [list, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    }),
    prisma.order.count({ where }),
  ])

  return c.json({ code: 0, message: 'ok', data: { list, total } })
})

// 买家订单详情
orderRoutes.get('/:id', userAuth, async (c) => {
  const userId = c.get('jwtPayload').sub
  const order = await prisma.order.findFirst({
    where: { id: c.req.param('id'), userId },
    include: { items: true },
  })
  if (!order) return c.json({ code: 404, message: '订单不存在' }, 404)
  return c.json({ code: 0, message: 'ok', data: order })
})

// ─── 商家接口 ──────────────────────────────────────────────────────────────────

// 商家订单列表
orderRoutes.get('/seller/list', sellerAuth, async (c) => {
  const sellerId = c.get('jwtPayload').sub
  const { status, page = '1', pageSize = '20' } = c.req.query()

  const where = {
    sellerId,
    ...(status ? { status: status as any } : {}),
  }

  const [list, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    }),
    prisma.order.count({ where }),
  ])

  return c.json({ code: 0, message: 'ok', data: { list, total } })
})

// 商家发货
orderRoutes.post('/:id/ship', sellerAuth,
  zValidator('json', z.object({
    trackingNo: z.string().min(1),
    trackingCompany: z.string().min(1),
  })),
  async (c) => {
    const sellerId = c.get('jwtPayload').sub
    const order = await prisma.order.findFirst({
      where: { id: c.req.param('id'), sellerId, status: 'PENDING_SHIP' },
    })
    if (!order) return c.json({ code: 404, message: '订单不存在或状态不正确' }, 404)

    const { trackingNo, trackingCompany } = c.req.valid('json')
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'SHIPPED', trackingNo, trackingCompany, shipAt: new Date() },
    })

    return c.json({ code: 0, message: '发货成功', data: updated })
  }
)
