---
name: fashop-api
description: FaShop 项目 API 开发辅助：生成符合项目规范的 Hono 路由、Prisma 查询、Zod 校验、统一响应格式和 JWT 鉴权中间件。当用户需要新增接口、查询数据库、处理鉴权或错误时使用。
---

# FaShop API 开发规范

## 技术栈

- **框架**：Node.js + **Hono**（非 Express）
- **ORM**：Prisma（MySQL）
- **校验**：Zod + `@hono/zod-validator`
- **鉴权**：JWT（`jsonwebtoken`）
- **缓存**：Redis
- **语言**：TypeScript

---

## 统一响应格式

```ts
// 成功
c.json({ code: 0, message: 'ok', data: ... })
c.json({ code: 0, message: '创建成功', data: ... }, 201)

// 失败
c.json({ code: 400, message: '参数错误' }, 400)
c.json({ code: 401, message: '请先登录' }, 401)
c.json({ code: 403, message: '无权限' }, 403)
c.json({ code: 404, message: 'xxx 不存在' }, 404)
```

## 分页响应结构

```ts
return c.json({ code: 0, message: 'ok', data: { list, total, page: Number(page), pageSize: Number(pageSize) } })
```

---

## 路由文件结构

```ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { userAuth, sellerAuth } from '../middlewares/auth.js'

export const xxxRoutes = new Hono()

// ─── 买家接口 ──────────────────────────────────────────────────────────────────

// ─── 商家接口 ──────────────────────────────────────────────────────────────────
```

新建路由后，在 `src/app.ts` 中注册：

```ts
api.route('/xxx', xxxRoutes)
```

---

## 鉴权中间件

| 中间件 | 用途 | 获取身份 |
|---|---|---|
| `userAuth` | 买家接口 | `c.get('jwtPayload').sub` → `userId` |
| `sellerAuth` | 商家接口 | `c.get('jwtPayload').sub` → `sellerId` |

```ts
// 用法：放在处理器前
xxxRoutes.get('/me', userAuth, async (c) => {
  const userId = c.get('jwtPayload').sub
  ...
})

// 带 Zod 校验
xxxRoutes.post('/', sellerAuth, zValidator('json', schema), async (c) => {
  const body = c.req.valid('json')
  ...
})
```

---

## Prisma 常用模式

### 分页列表 + 总数

```ts
const { page = '1', pageSize = '20', keyword } = c.req.query()
const skip = (Number(page) - 1) * Number(pageSize)

const [list, total] = await Promise.all([
  prisma.xxx.findMany({ where, skip, take: Number(pageSize), orderBy: { createdAt: 'desc' } }),
  prisma.xxx.count({ where }),
])
```

### 资源归属校验（防越权）

```ts
const item = await prisma.xxx.findFirst({ where: { id, sellerId } })
if (!item) return c.json({ code: 404, message: 'xxx 不存在' }, 404)
```

### 事务（扣库存 + 创建记录）

```ts
const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
  await tx.sku.update({ where: { id }, data: { stock: { decrement: qty } } })
  return tx.order.create({ data: { ... } })
})
```

### 关联查询

```ts
prisma.product.findUnique({
  where: { id },
  include: {
    skus: true,
    seller: { select: { shopName: true, logo: true } },
  },
})
```

---

## 数据库 Schema 关键约定

- **ID**：`String @id @default(cuid())`
- **金额**：`Int`，单位**分**（如 `price: 1999` = ¥19.99）
- **JSON 字段**：`images: Json` (string[])、`specs: Json` (Record<string,string>)、`address: Json`（快照）
- **时间**：`createdAt DateTime @default(now())`、`updatedAt DateTime @updatedAt`
- **枚举**：`ProductStatus`（ON_SALE / OFF_SALE）、`OrderStatus`（PENDING_PAY / PENDING_SHIP / SHIPPED / DONE / CANCELLED / REFUNDING / REFUNDED）、`CouponType`（FIXED / PERCENT）

### 模型关系速查

```
User ──< Order >── Seller
User ──< Address
User ──< UserOAuth
Seller ──< Product ──< Sku ──< OrderItem >── Order
Seller ──< Coupon
```

---

## Zod Schema 示例

```ts
const createSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().int().positive(),           // 单位：分
  images: z.array(z.string().url()).min(1).max(9),
  specs: z.record(z.string()),                  // { "颜色": "红色" }
  status: z.enum(['ON_SALE', 'OFF_SALE']).optional(),
})
```

---

## 注意事项

- 所有 import 路径加 `.js` 后缀（ESM）
- 生成 JWT 用 `signToken({ sub: id, role: 'user' | 'seller' })`（来自 `middlewares/auth.ts`）
- Redis 实例从 `lib/redis.ts` 导入
- 不要直接使用 `req.body`，用 `c.req.json()` 或 `c.req.valid('json')`
