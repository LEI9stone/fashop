import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { redis } from '../lib/redis.js'
import { prisma } from '../lib/prisma.js'
import { userAuth } from '../middlewares/auth.js'

export const cartRoutes = new Hono()

// 购物车存储在 Redis，key: cart:{userId}，value: hash { skuId: quantity }

cartRoutes.use('*', userAuth)

// 获取购物车
cartRoutes.get('/', async (c) => {
  const userId = c.get('jwtPayload').sub
  const cartHash = await redis.hgetall(`cart:${userId}`)

  if (!cartHash || Object.keys(cartHash).length === 0) {
    return c.json({ code: 0, message: 'ok', data: [] })
  }

  const skuIds = Object.keys(cartHash)
  const skus = await prisma.sku.findMany({
    where: { id: { in: skuIds } },
    include: { product: { select: { id: true, name: true, cover: true, status: true } } },
  })

  const cartItems = skus.map((sku) => ({
    skuId: sku.id,
    quantity: Number(cartHash[sku.id]),
    price: sku.price,
    stock: sku.stock,
    specs: sku.specs,
    product: sku.product,
  }))

  return c.json({ code: 0, message: 'ok', data: cartItems })
})

// 加入购物车
cartRoutes.post('/add',
  zValidator('json', z.object({
    skuId: z.string(),
    quantity: z.number().int().positive(),
  })),
  async (c) => {
    const userId = c.get('jwtPayload').sub
    const { skuId, quantity } = c.req.valid('json')

    const sku = await prisma.sku.findUnique({ where: { id: skuId } })
    if (!sku) return c.json({ code: 400, message: '商品不存在' }, 400)

    await redis.hincrby(`cart:${userId}`, skuId, quantity)
    await redis.expire(`cart:${userId}`, 60 * 60 * 24 * 30)  // 30天过期

    return c.json({ code: 0, message: '已加入购物车' })
  }
)

// 更新数量
cartRoutes.patch('/update',
  zValidator('json', z.object({
    skuId: z.string(),
    quantity: z.number().int().min(0),
  })),
  async (c) => {
    const userId = c.get('jwtPayload').sub
    const { skuId, quantity } = c.req.valid('json')

    if (quantity === 0) {
      await redis.hdel(`cart:${userId}`, skuId)
    } else {
      await redis.hset(`cart:${userId}`, skuId, quantity)
    }

    return c.json({ code: 0, message: 'ok' })
  }
)

// 删除购物车商品
cartRoutes.delete('/:skuId', async (c) => {
  const userId = c.get('jwtPayload').sub
  await redis.hdel(`cart:${userId}`, c.req.param('skuId'))
  return c.json({ code: 0, message: '已删除' })
})
