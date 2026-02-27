import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { sellerAuth, userAuth } from '../middlewares/auth.js'

export const productRoutes = new Hono()

// ─── 买家接口 ──────────────────────────────────────────────────────────────────

// 商品列表（买家）
productRoutes.get('/', async (c) => {
  const { page = '1', pageSize = '20', keyword } = c.req.query()
  const skip = (Number(page) - 1) * Number(pageSize)

  const where = {
    status: 'ON_SALE' as const,
    ...(keyword ? { name: { contains: keyword } } : {}),
  }

  const [list, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { skus: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(pageSize),
    }),
    prisma.product.count({ where }),
  ])

  return c.json({ code: 0, message: 'ok', data: { list, total, page: Number(page), pageSize: Number(pageSize) } })
})

// 商品详情（买家）
productRoutes.get('/:id', async (c) => {
  const product = await prisma.product.findUnique({
    where: { id: c.req.param('id') },
    include: { skus: true, seller: { select: { shopName: true, logo: true } } },
  })
  if (!product) return c.json({ code: 404, message: '商品不存在' }, 404)
  return c.json({ code: 0, message: 'ok', data: product })
})

// ─── 商家接口 ──────────────────────────────────────────────────────────────────

const skuSchema = z.object({
  specs: z.record(z.string()),
  price: z.number().int().positive(),
  stock: z.number().int().min(0),
})

const createProductSchema = z.object({
  name: z.string().min(1).max(100),
  cover: z.string().url(),
  images: z.array(z.string().url()).min(1).max(9),
  detail: z.string(),
  skus: z.array(skuSchema).min(1),
})

// 创建商品（商家）
productRoutes.post('/', sellerAuth, zValidator('json', createProductSchema), async (c) => {
  const sellerId = c.get('jwtPayload').sub
  const body = c.req.valid('json')

  const product = await prisma.product.create({
    data: {
      sellerId,
      name: body.name,
      cover: body.cover,
      images: body.images,
      detail: body.detail,
      skus: { create: body.skus },
    },
    include: { skus: true },
  })

  return c.json({ code: 0, message: '创建成功', data: product }, 201)
})

// 更新商品（商家）
productRoutes.patch('/:id', sellerAuth, async (c) => {
  const sellerId = c.get('jwtPayload').sub
  const product = await prisma.product.findFirst({
    where: { id: c.req.param('id'), sellerId },
  })
  if (!product) return c.json({ code: 404, message: '商品不存在' }, 404)

  const body = await c.req.json()
  const updated = await prisma.product.update({
    where: { id: product.id },
    data: body,
    include: { skus: true },
  })

  return c.json({ code: 0, message: '更新成功', data: updated })
})

// 商家商品列表
productRoutes.get('/seller/list', sellerAuth, async (c) => {
  const sellerId = c.get('jwtPayload').sub
  const { page = '1', pageSize = '20' } = c.req.query()
  const skip = (Number(page) - 1) * Number(pageSize)

  const [list, total] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId },
      include: { skus: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(pageSize),
    }),
    prisma.product.count({ where: { sellerId } }),
  ])

  return c.json({ code: 0, message: 'ok', data: { list, total } })
})
