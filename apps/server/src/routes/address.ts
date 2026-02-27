import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { userAuth } from '../middlewares/auth.js'

export const addressRoutes = new Hono()

addressRoutes.use('*', userAuth)

const addressSchema = z.object({
  name: z.string().min(1),
  phone: z.string().regex(/^1[3-9]\d{9}$/),
  province: z.string().min(1),
  city: z.string().min(1),
  district: z.string().min(1),
  detail: z.string().min(1),
  isDefault: z.boolean().optional(),
})

// 获取地址列表
addressRoutes.get('/', async (c) => {
  const userId = c.get('jwtPayload').sub
  const list = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { id: 'desc' }],
  })
  return c.json({ code: 0, message: 'ok', data: list })
})

// 新增地址
addressRoutes.post('/', zValidator('json', addressSchema), async (c) => {
  const userId = c.get('jwtPayload').sub
  const body = c.req.valid('json')

  if (body.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } })
  }

  const address = await prisma.address.create({ data: { ...body, userId } })
  return c.json({ code: 0, message: '添加成功', data: address }, 201)
})

// 更新地址
addressRoutes.patch('/:id', zValidator('json', addressSchema.partial()), async (c) => {
  const userId = c.get('jwtPayload').sub
  const address = await prisma.address.findFirst({ where: { id: c.req.param('id'), userId } })
  if (!address) return c.json({ code: 404, message: '地址不存在' }, 404)

  const body = c.req.valid('json')
  if (body.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } })
  }

  const updated = await prisma.address.update({ where: { id: address.id }, data: body })
  return c.json({ code: 0, message: '更新成功', data: updated })
})

// 删除地址
addressRoutes.delete('/:id', async (c) => {
  const userId = c.get('jwtPayload').sub
  const address = await prisma.address.findFirst({ where: { id: c.req.param('id'), userId } })
  if (!address) return c.json({ code: 404, message: '地址不存在' }, 404)
  await prisma.address.delete({ where: { id: address.id } })
  return c.json({ code: 0, message: '删除成功' })
})
