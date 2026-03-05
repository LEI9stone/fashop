import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { userAuth } from '../middlewares/auth.js'

export const userRoutes = new Hono()

userRoutes.get('/profile', userAuth, async (c) => {
  const userId = c.get('jwtPayload').sub

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nickname: true,
      avatar: true,
    },
  })

  if (!user) {
    return c.json({ code: 404, message: '用户不存在' }, 404)
  }

  return c.json({ code: 0, message: 'ok', data: user })
})
