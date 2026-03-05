# Zod 入门指南

> 基于 Zod v4，适用于本项目（`@fashop/schema`）的前后端共享校验场景。

---

## 什么是 Zod

Zod 是一个 TypeScript-first 的数据校验库。你可以用它来：

- 校验用户输入（表单、API 参数）
- 从 schema 自动推导 TypeScript 类型，不用手动写 `interface`
- 前后端共享同一套校验规则

零外部依赖，压缩后约 2KB（核心），浏览器和 Node.js 都能用。

---

## 安装

```bash
pnpm add zod
```

---

## 一、基础类型

```typescript
import { z } from 'zod'

z.string()    // 字符串
z.number()    // 数字
z.boolean()   // 布尔值
z.date()      // 日期对象
z.null()      // null
z.undefined() // undefined
z.any()       // 任意类型（跳过校验）
z.unknown()   // 未知类型（需要自行收窄）
```

**字面量类型** — 值必须完全等于指定值：

```typescript
z.literal('active')  // 只能是 'active'
z.literal(42)        // 只能是 42
z.literal(true)      // 只能是 true
```

---

## 二、字符串校验

场景：用户名、手机号、邮箱、URL 等文本输入。

```typescript
// 长度限制
z.string().min(1, '不能为空')
z.string().max(20, '最多20个字符')
z.string().length(11, '长度必须是11位')

// 格式校验
z.string().email('邮箱格式错误')
z.string().url('请输入合法URL')
z.string().uuid('UUID格式错误')

// 正则 — 本项目手机号校验就用这种方式
z.string().regex(/^1[3-9]\d{9}$/, '手机号格式错误')

// 前缀/后缀/包含
z.string().startsWith('https://')
z.string().endsWith('.com')
z.string().includes('@')

// 自动处理
z.string().trim()          // 校验前自动去首尾空格
z.string().toLowerCase()   // 校验前自动转小写
```

---

## 三、数字校验

场景：价格、库存、年龄等数值输入。

```typescript
z.number().min(0, '不能为负数')
z.number().max(9999, '不能超过9999')
z.number().int('必须是整数')
z.number().positive('必须是正数')
z.number().nonnegative('不能为负')
z.number().multipleOf(0.01)  // 精确到分（价格场景）
```

**表单输入通常是字符串**，用 `coerce` 自动转换：

```typescript
z.coerce.number()   // "123"  → 123
z.coerce.boolean()  // "true" → true
z.coerce.date()     // "2026-01-01" → Date 对象
```

---

## 四、对象（最常用）

场景：API 请求体、表单数据。

```typescript
const loginSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式错误'),
  password: z.string().min(6, '密码至少6位'),
})

// 校验通过 → 返回类型安全的数据
const data = loginSchema.parse({ phone: '13800138000', password: '123456' })
// data.phone  → string
// data.password → string
```

### 对象操作方法

```typescript
// extend — 基于现有 schema 扩展字段
const registerSchema = loginSchema.extend({
  nickname: z.string().min(1, '昵称不能为空'),
})

// pick — 只保留指定字段
const phoneOnly = loginSchema.pick({ phone: true })
// => { phone: string }

// omit — 排除指定字段
const noPassword = loginSchema.omit({ password: true })
// => { phone: string }

// partial — 所有字段变为可选（适合「更新」接口，部分更新）
const updateSchema = loginSchema.partial()
// => { phone?: string, password?: string }

// required — partial 的逆操作，所有字段变为必填
updateSchema.required()

// merge — 合并两个对象 schema
const merged = schemaA.merge(schemaB)

// passthrough — 允许额外字段透传（默认会剥离未定义的字段）
loginSchema.passthrough()

// strict — 有额外字段就报错
loginSchema.strict()
```

---

## 五、数组与元组

场景：标签列表、批量提交、商品规格。

```typescript
// 基础数组
z.array(z.string())           // string[]

// 带约束
z.array(z.number()).min(1, '至少选一个')
z.array(z.number()).max(10, '最多10个')
z.array(z.string()).nonempty('不能为空数组')

// 元组 — 固定长度和各位置的类型
z.tuple([z.string(), z.number()])  // [string, number]
```

---

## 六、枚举与联合类型

场景：状态、平台类型、多态数据。

```typescript
// 枚举 — 值只能是列表中的一个
z.enum(['weapp', 'tt', 'h5'])

// 联合类型 (A | B)
z.union([z.string(), z.number()])

// 可辨识联合 — 根据某个字段区分不同结构
z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), content: z.string() }),
  z.object({ type: z.literal('image'), url: z.string().url() }),
])
```

---

## 七、可选、可空与默认值

场景：非必填字段、缺省配置。

```typescript
z.string().optional()          // string | undefined
z.string().nullable()          // string | null
z.string().nullish()           // string | null | undefined

z.string().default('匿名')     // 缺失时自动填入 '匿名'
z.number().catch(0)            // 校验失败时用 0 兜底（不报错）
```

---

## 八、校验执行

### `parse` — 失败抛异常

适合服务端，异常会被全局错误处理捕获：

```typescript
try {
  const data = loginSchema.parse(input)
  // data 类型安全，直接使用
} catch (err) {
  // ZodError
}
```

### `safeParse` — 不抛异常，返回结果对象

适合客户端表单校验，可以自己决定如何展示错误：

```typescript
const result = loginSchema.safeParse(input)

if (!result.success) {
  // result.error.issues 是错误数组
  const firstError = result.error.issues[0].message
  console.log(firstError)  // '手机号格式错误'
} else {
  // result.data 类型安全
  console.log(result.data.phone)
}
```

> **注意**：Zod v4 中错误数组是 `error.issues`（v3 是 `error.errors`）。

### 异步版本

用于含异步校验逻辑（如 `refine` 中查数据库）的 schema：

```typescript
await schema.parseAsync(input)
await schema.safeParseAsync(input)
```

---

## 九、自定义校验（refine / superRefine）

场景：业务逻辑校验，如「确认密码一致」、「结束时间大于开始时间」。

### refine — 简单场景

```typescript
const passwordSchema = z.string().refine(
  (val) => /[A-Z]/.test(val),
  { message: '密码必须包含至少一个大写字母' }
)
```

### superRefine — 复杂场景，可添加多个错误

```typescript
const registerForm = z.object({
  password: z.string().min(6),
  confirmPassword: z.string(),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: 'custom',
      message: '两次密码不一致',
      path: ['confirmPassword'],  // 错误关联到哪个字段
    })
  }
})
```

---

## 十、类型推导

Zod 最大的优势之一：**从 schema 自动生成 TypeScript 类型**，不用重复定义。

```typescript
const UserSchema = z.object({
  phone: z.string(),
  nickname: z.string(),
  age: z.number().optional(),
})

// 推导出类型，等价于手写 interface
type User = z.infer<typeof UserSchema>
// => { phone: string; nickname: string; age?: number }

// 如果 schema 有 transform，input 和 output 类型可能不同
type UserInput = z.input<typeof UserSchema>    // transform 前
type UserOutput = z.output<typeof UserSchema>   // transform 后
```

---

## 十一、transform — 校验 + 转换

场景：输入是字符串，但业务需要数字；输入需要格式化。

```typescript
// 字符串转数字
const priceSchema = z.string().transform((val) => parseFloat(val))
// parse("9.99") → 9.99 (number)

// 校验 → 转换 → 再校验（pipe）
const positivePrice = z.string()
  .transform((val) => parseFloat(val))
  .pipe(z.number().positive('价格必须大于0'))
```

---

## 十二、实战：本项目中的用法

### 定义共享 schema（`packages/schema/src/auth.ts`）

```typescript
import { z } from 'zod'

export const userLoginSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式错误'),
  password: z.string().min(6),
})

export const userRegisterSchema = userLoginSchema.extend({
  nickname: z.string().min(1),
})
```

### 服务端使用（`apps/server`）

通过 `@hono/zod-validator` 中间件自动校验请求参数：

```typescript
import { userLoginSchema } from '@fashop/schema'
import { validate } from '../middlewares/validate.js'

authRoutes.post(
  '/user/login',
  validate('json', userLoginSchema),  // 校验失败自动返回 400
  async (c) => {
    const { phone, password } = c.req.valid('json')  // 类型安全
    // ...
  },
)
```

### 客户端使用（`apps/buyer`）

用 `safeParse` 在提交前校验，展示友好的错误提示：

```typescript
import { userLoginSchema } from '@fashop/schema'

const result = userLoginSchema.safeParse({ phone, password })
if (!result.success) {
  Taro.showToast({ title: result.error.issues[0].message, icon: 'none' })
  return
}
// 校验通过，发请求...
```

### 好处

- **前后端共享**：校验规则只写一次，放在 `packages/schema` 中
- **类型自动推导**：不用手动写 `interface`，从 schema 推导
- **错误信息统一**：前后端展示一致的校验错误文案

---

## 参考链接

- [Zod 官方文档](https://zod.dev)
- [Zod v4 迁移指南](https://zod.dev/v4/changelog)
- [Zod GitHub](https://github.com/colinhacks/zod)
