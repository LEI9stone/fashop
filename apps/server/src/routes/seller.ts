import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { sellerAuth } from '../middlewares/auth.js'

export const sellerRoutes = new Hono()

sellerRoutes.use('*', sellerAuth)

// 商家信息
sellerRoutes.get('/profile', async (c) => {
  const sellerId = c.get('jwtPayload').sub
  const seller = await prisma.seller.findUnique({
    where: { id: sellerId },
    select: {
      id: true,
      phone: true,
      shopName: true,
      logo: true,
      description: true,
      createdAt: true,
    },
  })
  return c.json({ code: 0, message: 'ok', data: seller })
})

// 数据看板
sellerRoutes.get('/dashboard', async (c) => {
  const sellerId = c.get('jwtPayload').sub
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [todayOrders, pendingShip, totalRevenue] = await Promise.all([
    prisma.order.count({
      where: { sellerId, createdAt: { gte: todayStart } },
    }),
    prisma.order.count({
      where: { sellerId, status: 'PENDING_SHIP' },
    }),
    prisma.order.aggregate({
      where: { sellerId, status: { in: ['SHIPPED', 'DONE'] } },
      _sum: { totalAmount: true },
    }),
  ])

  return c.json({
    code: 0,
    message: 'ok',
    data: {
      todayOrders,
      pendingShip,
      totalRevenue: totalRevenue._sum.totalAmount ?? 0,
    },
  })
})
