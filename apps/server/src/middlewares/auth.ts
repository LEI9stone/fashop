import { createMiddleware } from 'hono/factory'
import jwt from 'jsonwebtoken'

export interface JwtPayload {
  sub: string        // userId 或 sellerId
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
 * 生成 JWT Token
 */
export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  })
}
