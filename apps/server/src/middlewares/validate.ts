import { zValidator } from '@hono/zod-validator'
import type { z } from 'zod'

export const validate = <T extends z.ZodType>(target: 'json' | 'query' | 'param', schema: T) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? '参数错误'
      return c.json({ code: 400, message }, 400)
    }
  })
