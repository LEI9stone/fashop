# 前端工程师转后端开发学习路径

> 专为有前端经验、零后端基础的工程师编写
> 结合 FaShop 项目（Hono + Prisma + MySQL）实践

---

## 一、核心认知：你已经懂了一半

后端开发不是全新领域，大量概念和前端有直接的映射关系。

| 你熟悉的前端概念 | 后端对应概念 | 相似点 |
|----------------|------------|--------|
| `fetch/axios` 发请求 | Hono 路由接收请求 | 一个发，一个收，镜像关系 |
| React 组件 props | Request Body / Query Params | 都是"输入参数" |
| 组件 return JSX | `c.json(...)` 返回响应 | 都是"输出结果" |
| `useState` | 数据库 | 都是存储数据，数据库是持久化的 |
| `localStorage` | Redis | key-value 存储，Redis 在服务端 |
| `useEffect` 副作用 | 中间件 Middleware | 在主逻辑前后执行的代码 |
| React Router 路由守卫 | JWT 认证中间件 | 未登录则拦截，已登录则放行 |
| TypeScript interface | Prisma Schema | 都是描述数据结构 |
| `.env` 环境变量 | `.env` 环境变量 | 完全一样 |
| 前端调用的 API 文档 | 路由定义本身 | 路由就是接口契约 |

**最重要的认知**：前端是「消费 API 的人」，后端是「提供 API 的人」，你只是换了角色。

---

## 二、必须理解的核心概念

### 1. HTTP 请求与响应

```
浏览器/小程序（前端）                    服务器（后端）
       │                                      │
       │  POST /api/orders                    │
       │  Headers: Authorization: Bearer xxx  │
       │  Body: { skuId, quantity, addressId }│
       │ ─────────────────────────────────►  │
       │                                      │  接收请求
       │                                      │  验证 Token
       │                                      │  校验参数
       │                                      │  操作数据库
       │  200 OK                              │
       │  Body: { code: 0, data: { orderId }} │
       │ ◄─────────────────────────────────  │
```

**你需要理解**：
- HTTP 方法语义：`GET`（查）`POST`（创建）`PATCH`（更新）`DELETE`（删除）
- 状态码：`200`成功 `201`创建成功 `400`请求错误 `401`未登录 `403`无权限 `404`不存在 `500`服务器错误
- Headers：请求头（Authorization、Content-Type）和响应头的作用

---

### 2. 数据库基础（MySQL）

**类比理解**：

```
数据库    ≈  一个 Excel 文件
表（Table）≈  Excel 里的一个 Sheet
行（Row）  ≈  Sheet 里的一行数据
列（Column）≈  Sheet 里的一列（字段）
```

**最常用的 SQL 操作**（Prisma 帮你生成，但要理解背后逻辑）：

```sql
-- 查询（对应 prisma.product.findMany）
SELECT * FROM products WHERE status = 'ON_SALE' LIMIT 20;

-- 创建（对应 prisma.product.create）
INSERT INTO products (id, name, price) VALUES ('xxx', '连衣裙', 9900);

-- 更新（对应 prisma.product.update）
UPDATE products SET stock = stock - 1 WHERE id = 'xxx';

-- 删除（对应 prisma.product.delete）
DELETE FROM products WHERE id = 'xxx';
```

**关联关系**：

```
一个商家（Seller）可以有多个商品（Product）→ 一对多关系
一个商品有多个规格（Sku）                  → 一对多关系
一个订单包含多个商品                        → 多对多关系（通过 OrderItem 中间表）

关联的实现方式：外键（Foreign Key）
Product 表里有 sellerId 字段，指向 Seller 表的 id
这就是"外键"，保证数据一致性（不能创建没有商家的商品）
```

---

### 3. Prisma ORM

ORM（对象关系映射）让你用 TypeScript 操作数据库，不用手写 SQL。

**Schema 定义 = TypeScript interface 的持久化版本**：

```prisma
// prisma/schema.prisma
model Product {
  id       String @id @default(cuid())  // 主键，自动生成
  name     String                        // 普通字段
  price    Int                           // 整数（存分，不存元）
  sellerId String                        // 外键字段
  seller   Seller @relation(...)         // 关联关系
}
```

**常用 Prisma 操作**：

```typescript
// 查多条（带条件、分页）
const products = await prisma.product.findMany({
  where: { status: 'ON_SALE' },    // WHERE status = 'ON_SALE'
  orderBy: { createdAt: 'desc' },  // ORDER BY created_at DESC
  skip: 0,                          // OFFSET 0
  take: 20,                         // LIMIT 20
  include: { skus: true },          // JOIN skus 表
})

// 查单条
const product = await prisma.product.findUnique({
  where: { id: 'xxx' },
})

// 创建
const product = await prisma.product.create({
  data: { name: '连衣裙', price: 9900, sellerId: 'yyy' },
})

// 更新
const product = await prisma.product.update({
  where: { id: 'xxx' },
  data: { stock: { decrement: 1 } },  // stock = stock - 1
})

// 删除
await prisma.product.delete({ where: { id: 'xxx' } })

// 统计
const count = await prisma.product.count({ where: { sellerId: 'yyy' } })
```

**数据库迁移**（每次修改 Schema 后必须执行）：

```bash
# 开发环境：自动生成迁移文件并执行
pnpm db:migrate

# 查看迁移历史
ls prisma/migrations/

# 可视化数据库管理界面
pnpm db:studio
```

---

### 4. 身份认证（JWT）

**JWT = 服务端签发的"身份证"**

```
登录流程：
  1. 用户发送手机号+密码（或微信 code）
  2. 后端验证身份
  3. 后端生成 JWT Token（包含用户 ID）并返回
  4. 前端保存 Token（localStorage / Taro.setStorage）

后续请求流程：
  1. 前端每次请求都带上 Token（Header: Authorization: Bearer xxx）
  2. 后端中间件验证 Token 是否合法、是否过期
  3. 从 Token 中取出用户 ID，知道是谁在操作
  4. 继续执行业务逻辑
```

**Token 结构**（可在 jwt.io 解码）：

```
eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEyMyIsInJvbGUiOiJ1c2VyIn0.xxx
         ↑                        ↑                              ↑
       Header               Payload（数据）                   Signature（签名）
   （加密算法）           （用户ID、角色等）                  （防篡改）
```

**在 FaShop 中的实现**（`src/middlewares/auth.ts`）：

```typescript
// 中间件：验证 Token，把用户信息挂到 context
export const userAuth = createMiddleware(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  const payload = jwt.verify(token, process.env.JWT_SECRET!)
  c.set('jwtPayload', payload)  // 把用户信息存到 context
  await next()                   // 继续执行后续逻辑
})

// 在路由中使用
orderRoutes.post('/', userAuth, async (c) => {
  const userId = c.get('jwtPayload').sub  // 取出当前用户 ID
  // ...
})
```

---

### 5. 数据库事务

**事务 = 要么全成功，要么全失败**

经典场景：创建订单时，需要同时「扣库存」+「创建订单记录」

```typescript
// ❌ 不用事务的风险
await prisma.sku.update({ data: { stock: { decrement: 1 } } })
// ← 如果这里服务器崩了，库存少了但订单没创建，数据不一致！
await prisma.order.create({ data: orderData })

// ✅ 用事务：两步操作绑定在一起
await prisma.$transaction(async (tx) => {
  await tx.sku.update({ data: { stock: { decrement: 1 } } })
  await tx.order.create({ data: orderData })
  // 任何一步失败，两步都回滚，数据库恢复原状
})
```

**ACID 四个特性**（面试必考，实际开发必须理解）：

```
A - Atomicity  原子性：事务要么全做，要么全不做
C - Consistency 一致性：事务前后，数据都满足约束条件
I - Isolation   隔离性：多个事务并发，互不干扰
D - Durability  持久性：事务提交后，数据永久保存
```

---

### 6. Redis 缓存

**Redis = 服务端的超快速 key-value 存储**

```
MySQL（关系型数据库）：
  ✅ 数据持久化，重启不丢失
  ✅ 支持复杂查询、关联、事务
  ❌ 速度相对慢（毫秒级）

Redis（内存数据库）：
  ✅ 速度极快（微秒级，比 MySQL 快 100 倍）
  ✅ 适合频繁读写的临时数据
  ❌ 内存有限，不适合存大量数据
  ❌ 默认重启会丢失数据（可配置持久化）
```

**FaShop 中 Redis 的用途**：

```typescript
// 购物车存 Redis（频繁读写，临时数据）
await redis.hset(`cart:${userId}`, skuId, quantity)
await redis.hgetall(`cart:${userId}`)

// 未来可以用 Redis 做的事：
// - 库存预扣（秒杀场景，防超卖）
// - 接口限流（防刷接口）
// - 验证码存储（5分钟有效期）
// - 热门商品缓存（减少数据库压力）
```

---

### 7. 中间件（Middleware）

**中间件 = 请求管道中的拦截器，类似 useEffect 的拦截逻辑**

```
请求进来
  ↓
[日志中间件] → 记录请求时间、路径
  ↓
[CORS 中间件] → 添加跨域响应头
  ↓
[JWT 认证中间件] → 验证 Token，未登录则返回 401
  ↓
[业务路由处理] → 查数据库，返回数据
  ↓
响应返回
```

**在 Hono 中的写法**（`src/app.ts`）：

```typescript
// 全局中间件
app.use('*', logger())   // 所有请求都打日志
app.use('/api/*', cors()) // 所有 API 接口加 CORS 头

// 路由级中间件（只对这个路由生效）
orderRoutes.post('/', userAuth, async (c) => { ... })
//                   ↑ 这个路由专用的认证中间件
```

---

### 8. 幂等性

**幂等性 = 同一个操作执行多次，结果和执行一次一样**

```
为什么重要？
  微信支付回调可能因网络问题重复发送
  如果不处理：同一个订单被标记为"已支付"两次，甚至发两次货

处理方式：
  在处理支付回调前，先检查订单状态
  如果已经是"已支付"，直接返回成功（不重复处理）

// 支付回调处理
const order = await prisma.order.findUnique({ where: { id: orderId } })
if (order.status !== 'PENDING_PAY') {
  return c.json({ success: true })  // 已处理过，直接返回
}
// 否则才更新状态
await prisma.order.update({ data: { status: 'PENDING_SHIP' } })
```

---

## 三、学习节奏：从读到写到优化

### 第一周：读懂现有代码

```
Day 1：
  □ pnpm db:studio 打开数据库可视化界面
  □ 手动在 Prisma Studio 里创建一条 Seller 和 Product 数据
  □ 访问 http://localhost:3000/api/products 看接口返回

Day 2：
  □ 安装 Bruno（API 测试工具，比 Postman 更轻量）
  □ 测试 POST /api/auth/seller/login（需要先在数据库创建商家）
  □ 用拿到的 token 测试需要认证的接口

Day 3-4：
  □ 读完 src/routes/ 下所有路由文件
  □ 对照 Prisma Schema，理解每个接口操作了哪些表

Day 5-7：
  □ 读懂 JWT 中间件（src/middlewares/auth.ts）
  □ 理解购物车为什么用 Redis（src/routes/cart.ts）
  □ 理解订单创建的事务逻辑（src/routes/order.ts）
```

### 第二周：动手改造

```
任务 1：给商品加"销量"字段
  1. 在 schema.prisma 里的 Product 加 salesCount Int @default(0)
  2. 运行 pnpm db:migrate，观察生成的 SQL
  3. 在创建订单时，让对应商品的 salesCount += quantity
  4. 在商品列表接口里返回 salesCount

任务 2：实现收藏功能
  参考 address.ts，从零写 /api/favorites 接口
  - GET /api/favorites     获取收藏列表
  - POST /api/favorites    收藏商品
  - DELETE /api/favorites/:id  取消收藏
  （需要先在 schema.prisma 里添加 Favorite 表）

任务 3：给商品列表加分类筛选
  1. 在 schema.prisma 里添加 Category 表
  2. Product 关联 Category
  3. GET /api/products?categoryId=xxx 支持按分类筛选
```

### 第三周及以后：实现真实业务

```
□ 接入微信小程序登录（wx.login code 换 openid）
□ 接入微信支付（JSAPI 支付 + 支付回调）
□ 接入阿里云 OSS 直传（生成上传凭证）
□ 对接物流查询 API（快递100）
□ 实现微信订阅消息推送（新订单通知商家）
```

---

## 四、工具清单

| 工具 | 用途 | 安装方式 |
|------|------|---------|
| **Prisma Studio** | 数据库可视化管理 | `pnpm db:studio`（已内置） |
| **Bruno** | API 接口测试 | [usebruno.com](https://www.usebruno.com) |
| **TablePlus** | 数据库 GUI 客户端 | [tableplus.com](https://tableplus.com)（比 Prisma Studio 更强大） |
| **Docker Desktop** | 运行 MySQL/Redis | 已安装 |
| **Another Redis Desktop** | Redis 可视化管理 | 查看 Redis 里的购物车数据 |

---

## 五、遇到问题时的排查思路

### 接口报错 500

```
1. 看终端日志（后端启动的那个终端）
2. 找到具体的 Error 信息
3. 常见原因：
   - 数据库连接失败 → 检查 docker-compose 是否运行
   - Prisma 操作报错 → 检查字段名是否拼写正确
   - 未处理的 null 值 → 加可选链 ?. 或先判断是否存在
```

### 接口报错 401

```
Token 不对或过期
1. 用 Bruno 重新登录，获取新 token
2. 检查请求头是否加了 Authorization: Bearer <token>
3. 检查 JWT_SECRET 环境变量是否配置
```

### 数据库操作没生效

```
1. 检查是否忘记 await（Prisma 操作都是异步的）
2. 检查 where 条件是否正确
3. 用 Prisma Studio 直接查看数据库，确认数据状态
```

### Schema 修改后接口报错

```
忘记运行 pnpm db:migrate 了
每次修改 schema.prisma 都必须运行迁移
```

---

## 六、后端思维的核心转变

```
前端思维：         后端思维：
"这个数据怎么展示"  →  "这个数据怎么存储"
"用户点了什么"     →  "这个操作对数据有什么影响"
"接口返回了什么"   →  "接口应该做什么校验"
"状态怎么管理"     →  "数据一致性怎么保证"
"性能优化"        →  "数据库查询优化 + 缓存策略"
```

**最重要的后端思维**：

1. **永远不信任前端传来的数据** → 必须在后端再次校验
2. **考虑并发** → 两个用户同时买最后一件商品会怎样？
3. **考虑失败** → 支付成功但通知失败了怎么办？
4. **最小权限** → 用户只能操作自己的数据，不能操作别人的

---

## 七、参考资源

| 资源 | 说明 |
|------|------|
| [Prisma 文档](https://www.prisma.io/docs) | 数据库操作必备参考 |
| [Hono 文档](https://hono.dev) | 路由框架参考 |
| [SQLBolt](https://sqlbolt.com) | SQL 交互式入门（2天搞定） |
| [jwt.io](https://jwt.io) | JWT Token 可视化解码 |
| [HTTP 状态码](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status) | MDN 状态码参考 |
| [Redis 命令参考](https://redis.io/commands) | Redis 操作手册 |
