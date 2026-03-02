import { zValidator } from '@hono/zod-validator'
import type { ZodSchema } from 'zod'

export const validate = (target: 'json' | 'query' | 'param', schema: ZodSchema) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const message = result.error.errors[0]?.message ?? '参数错误'
      return c.json({ code: 400, message }, 400)
    }
  })
