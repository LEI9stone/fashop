import { createMiddleware } from 'hono/factory'
import jwt from 'jsonwebtoken'

export interface JwtPayload {
  sub: string // userId 或 sellerId
  role: 'user' | 'seller'
  iat?: number
  exp?: number
}

declare module 'hono' {
  interface ContextVariableMap {
    jwtPayload: JwtPayload
  }
}

/**
 * JWT 认证中间件（买家）
 */
export const userAuth = createMiddleware(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return c.json({ code: 401, message: '请先登录' }, 401)
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    if (payload.role !== 'user') {
      return c.json({ code: 403, message: '无权限' }, 403)
    }
    c.set('jwtPayload', payload)
    await next()
  } catch {
    return c.json({ code: 401, message: 'Token 已过期，请重新登录' }, 401)
  }
})

/**
 * JWT 认证中间件（商家）
 */
export const sellerAuth = createMiddleware(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return c.json({ code: 401, message: '请先登录' }, 401)
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    if (payload.role !== 'seller') {
      return c.json({ code: 403, message: '无权限' }, 403)
    }
    c.set('jwtPayload', payload)
    await next()
  } catch {
    return c.json({ code: 401, message: 'Token 已过期，请重新登录' }, 401)
  }
})

/**
 * 续签中间件
 */
export const autoRefresh = createMiddleware(async (c, next) => {
  await next()
  const payload = c.get('jwtPayload')
  if (!payload) return

  const exp = payload.exp! * 1000
  const sevenDays = 7 * 24 * 60 * 60 * 1000
  if (exp - Date.now() < sevenDays) {
    const newToken = signToken({ sub: payload.sub, role: payload.role })
    c.header('X-New-Token', newToken)
  }
})

/**
 * 生成 JWT Token
 */
export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '30d') as any,
  })
}
