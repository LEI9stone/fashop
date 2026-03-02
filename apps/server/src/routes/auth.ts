import { Hono } from 'hono'
import { validate } from '../middlewares/validate.js'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { signToken } from '../middlewares/auth.js'

export const authRoutes = new Hono()

// 微信/抖音小程序登录
authRoutes.post(
  '/miniapp/login',
  validate(
    'json',
    z.object({
      code: z.string(),
      platform: z.enum(['weapp', 'tt']),
    }),
  ),
  async (c) => {
    const { code, platform } = c.req.valid('json')

    // TODO: 调用微信/抖音接口，用 code 换取 openid
    // const openid = await getOpenid(code, platform)
    const openid = `mock_openid_${code}` // 开发占位

    // 查找或创建用户
    let oauthRecord = await prisma.userOAuth.findUnique({
      where: { platform_openid: { platform, openid } },
      include: { user: true },
    })

    if (!oauthRecord) {
      const user = await prisma.user.create({
        data: {
          phone: '',
          nickname: '新用户',
          oauths: {
            create: { platform, openid },
          },
        },
        include: { oauths: true },
      })
      const oauth = await prisma.userOAuth.findUnique({
        where: { platform_openid: { platform, openid } },
        include: { user: true },
      })
      oauthRecord = oauth
    }

    const token = signToken({ sub: oauthRecord!.userId, role: 'user' })
    return c.json({ code: 0, message: 'ok', data: { token, user: oauthRecord!.user } })
  },
)

// 商家登录
authRoutes.post(
  '/seller/login',
  validate(
    'json',
    z.object({
      phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式错误'),
      password: z.string().min(6),
    }),
  ),
  async (c) => {
    const { phone, password } = c.req.valid('json')

    const seller = await prisma.seller.findUnique({ where: { phone } })
    if (!seller || !(await bcrypt.compare(password, seller.password))) {
      return c.json({ code: 400, message: '手机号或密码错误' }, 400)
    }

    const token = signToken({ sub: seller.id, role: 'seller' })
    const { password: _, ...sellerData } = seller
    return c.json({ code: 0, message: 'ok', data: { token, seller: sellerData } })
  },
)

// 商家注册
authRoutes.post(
  '/seller/register',
  validate(
    'json',
    z.object({
      phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式错误'),
      password: z.string().min(6),
      shopName: z.string().min(1),
    }),
  ),
  async (c) => {
    const { phone, password, shopName } = c.req.valid('json')

    const exists = await prisma.seller.findUnique({ where: { phone } })
    if (exists) {
      return c.json({ code: 400, message: '该手机号已注册' }, 400)
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const seller = await prisma.seller.create({
      data: { phone, password: hashedPassword, shopName },
    })

    const token = signToken({ sub: seller.id, role: 'seller' })
    const { password: _, ...sellerData } = seller
    return c.json({ code: 0, message: '注册成功', data: { token, seller: sellerData } }, 201)
  },
)

// 用户注册(不区分买家和商家)
authRoutes.post(
  '/user/register',
  validate(
    'json',
    z.object({
      phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式错误'),
      password: z.string().min(6),
      nickname: z.string().min(1),
    }),
  ),
  async (c) => {
    const { phone, password, nickname } = c.req.valid('json')
    const exists = await prisma.user.findUnique({ where: { phone } })
    if (exists) {
      return c.json({ code: 400, message: '该手机号已注册' }, 400)
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { phone, password: hashedPassword, nickname },
    })
    const token = signToken({ sub: user.id, role: 'user' })
    return c.json({ code: 0, message: '注册成功', data: { token, user } }, 201)
  },
)

// 用户登录
authRoutes.post(
  '/user/login',
  validate(
    'json',
    z.object({
      phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式错误'),
      password: z.string().min(6),
    }),
  ),
  async (c) => {
    const { phone, password } = c.req.valid('json')
    const user = await prisma.user.findUnique({ where: { phone } })
    if (!user?.password) {
      return c.json({ code: 400, message: '该账号未通过密码注册' }, 400)
    }
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return c.json({ code: 400, message: '手机号或密码错误' }, 400)
    }
    const token = signToken({ sub: user.id, role: 'user' })
    return c.json({ code: 0, message: 'ok', data: { token, user } })
  },
)
