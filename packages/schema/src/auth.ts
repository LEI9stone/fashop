import { z } from 'zod'

export const userLoginSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式错误'),
  password: z.string().min(6, '密码长度至少为6位'),
})

export const userRegisterSchema = userLoginSchema.extend({
  nickname: z.string().min(1, '昵称不能为空'),
})

export const userRegisterConfirmSchema = userRegisterSchema
  .extend({
    confirmPassword: z.string().min(1, '确认密码不能为空'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: '两次密码不一致',
  })

export type LoginParams = z.infer<typeof userLoginSchema>
export type RegisterParams = z.infer<typeof userRegisterSchema>
