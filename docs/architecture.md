# FaShop 电商系统 — 项目架构文档

> 最后更新：2026-02-28

---

## 一、项目定位

| 项目 | 说明 |
|------|------|
| 目标用户 | 个体户商家（线上销售） |
| 核心场景 | 商家发布商品 → 买家浏览下单 → 支付 → 发货 → 收货 |
| 设备特点 | 移动优先，商家和买家均以手机为主 |
| 开发模式 | 单人全栈开发（前端主导 + AI 辅助后端） |

---

## 二、端划分

| 端 | 使用者 | 形态 | 入口 |
|----|--------|------|------|
| 买家端 | 消费者 | 微信小程序 + 抖音小程序 + H5 | 默认入口 |
| 商家端 | 个体户商家 | 同一个小程序内，身份切换后进入管理界面 | 登录后识别商家角色 |
| 后端服务 | — | Node.js REST API | Hono + Prisma |

> **架构决策**：商家管理功能内嵌在买家端小程序（`apps/buyer`）中，通过登录角色判断渲染不同界面。
> 不再单独维护 `apps/seller`，降低开发和维护成本。

---

## 三、技术栈全景

```
语言：全栈 TypeScript

买家端 + 商家端（apps/buyer）
  框架：      Taro 4.x + React 18
  状态管理：   Zustand
  UI 组件：   NutUI-React
  编译目标：   微信小程序 / 抖音小程序 / H5
  角色切换：   登录后根据 role（user / seller）渲染不同页面

后端（apps/server）
  框架：      Hono（轻量、TypeScript 友好）
  ORM：       Prisma（无需手写 SQL）
  数据库：    MySQL 8
  缓存：      Redis（购物车、库存预扣）
  文件存储：   阿里云 OSS（商品图片 / 视频）

工程化
  包管理：    pnpm
  Monorepo：  Turborepo
  共享类型：   packages/types（前后端复用）
  共享工具：   packages/utils
```

---

## 四、整体架构图

```
┌──────────────────────────────────────────────────────────────────┐
│                           客户端层                                 │
│                                                                    │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │                   apps/buyer（Taro + React）               │   │
│   │                                                            │   │
│   │   买家身份：  微信小程序 │ 抖音小程序 │ H5                  │   │
│   │   商家身份：  管理界面（商品/订单/数据看板）                  │   │
│   │                     ↑ 登录后根据 role 判断                  │   │
│   └──────────────────────────┬───────────────────────────────┘   │
└─────────────────────────────┼──────────────────────────────────-─┘
                              │ HTTPS
┌─────────────────────────────▼────────────────────────────────────┐
│                      Nginx（反向代理 + SSL + 限流）                 │
└─────────────────────────────┬────────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│                       应用服务层（Hono）                            │
│                                                                    │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│   │ 认证模块 │ │ 商品模块 │ │ 订单模块 │ │ 支付模块 │              │
│   └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│   │ 营销模块 │ │ 物流模块 │ │ 消息模块 │ │ 文件模块 │              │
│   └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
└─────────────────────────────┬────────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│                          数据存储层                                 │
│        MySQL 8      Redis      阿里云 OSS      消息队列             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 五、角色切换逻辑

```
用户打开小程序
      │
      ▼
  微信 / 抖音登录
      │
      ▼
  后端验证身份，返回 JWT（payload 中含 role）
      │
      ├── role = 'user'    →  买家首页（商品浏览、购物车、订单）
      │
      └── role = 'seller'  →  商家管理首页（数据看板、订单处理、商品管理）
```

**JWT Payload 结构：**

```typescript
interface JwtPayload {
  sub: string           // 用户 ID 或 商家 ID
  role: 'user' | 'seller'
}
```

**前端路由守卫：**

```typescript
// 访问商家页面时校验角色
const { role } = useUserStore()
if (role !== 'seller') {
  Taro.redirectTo({ url: '/pages/home/index' })
}
```

---

## 六、目录结构

```
fashop/
├── apps/
│   ├── buyer/                           # 买家端 + 商家端（同一个小程序）
│   │   └── src/
│   │       ├── pages/
│   │       │   │
│   │       │   ├── ── 买家页面 ──
│   │       │   ├── home/                # 首页
│   │       │   ├── category/            # 分类页
│   │       │   ├── search/              # 搜索页
│   │       │   ├── product/
│   │       │   │   ├── list/            # 商品列表
│   │       │   │   └── detail/          # 商品详情
│   │       │   ├── cart/                # 购物车
│   │       │   ├── checkout/            # 结算页
│   │       │   ├── order/
│   │       │   │   ├── list/            # 订单列表
│   │       │   │   └── detail/          # 订单详情
│   │       │   ├── address/             # 收货地址
│   │       │   ├── user/                # 个人中心
│   │       │   ├── auth/                # 登录（买家 + 商家共用）
│   │       │   │
│   │       │   └── ── 商家页面（seller 前缀隔离） ──
│   │       │       ├── seller/
│   │       │       │   ├── dashboard/   # 数据看板
│   │       │       │   ├── order/
│   │       │       │   │   ├── list/    # 订单列表
│   │       │       │   │   └── detail/  # 订单详情 + 发货
│   │       │       │   ├── product/
│   │       │       │   │   ├── list/    # 商品列表
│   │       │       │   │   ├── edit/    # 新增 / 编辑商品
│   │       │       │   │   └── stock/   # 库存管理
│   │       │       │   └── shop/
│   │       │       │       └── settings/ # 店铺设置
│   │       │
│   │       ├── components/
│   │       │   ├── buyer/               # 买家专用组件
│   │       │   │   ├── ProductCard/
│   │       │   │   ├── OrderCard/
│   │       │   │   ├── AddressForm/
│   │       │   │   ├── PayButton/       # 多端支付按钮
│   │       │   │   └── ShareButton/     # 多端分享按钮
│   │       │   └── seller/              # 商家专用组件
│   │       │       ├── StatCard/        # 数据统计卡片
│   │       │       ├── OrderActionBar/  # 发货 / 退款操作
│   │       │       ├── ProductForm/     # 商品编辑表单
│   │       │       ├── ImageUploader/   # 拍照上传
│   │       │       └── SkuEditor/       # SKU 规格编辑
│   │       │
│   │       ├── store/
│   │       │   ├── user.ts              # 买家用户状态（含 role）
│   │       │   ├── cart.ts              # 购物车状态
│   │       │   └── seller.ts            # 商家状态（店铺信息）
│   │       │
│   │       ├── api/
│   │       │   ├── client.ts            # 请求客户端（含拦截器）
│   │       │   ├── auth.ts
│   │       │   ├── product.ts
│   │       │   ├── order.ts
│   │       │   ├── cart.ts
│   │       │   └── seller.ts            # 商家端接口
│   │       │
│   │       └── hooks/
│   │           ├── useAuth.ts           # 登录态管理
│   │           ├── useRole.ts           # 角色守卫 hook
│   │           ├── usePay.ts            # 多端支付封装
│   │           ├── useShare.ts          # 多端分享封装
│   │           ├── useInfiniteList.ts   # 上拉加载更多
│   │           ├── useOrderNotify.ts    # 新订单通知（商家）
│   │           └── useUpload.ts         # 图片上传（商家）
│   │
│   └── server/                          # 后端服务
│       ├── src/
│       │   ├── index.ts                 # 启动入口
│       │   ├── routes/                  # 路由层
│       │   │   ├── auth.ts
│       │   │   ├── product.ts
│       │   │   ├── order.ts
│       │   │   ├── payment.ts
│       │   │   ├── cart.ts
│       │   │   ├── address.ts
│       │   │   ├── coupon.ts
│       │   │   ├── logistics.ts
│       │   │   └── file.ts
│       │   ├── services/                # 业务逻辑层
│       │   ├── middlewares/             # JWT 认证 / 限流 / 日志
│       │   └── utils/
│       │       ├── wechat-pay.ts        # 微信支付工具
│       │       ├── tt-pay.ts            # 抖音支付工具
│       │       ├── oss.ts               # OSS 直传凭证
│       │       └── sms.ts               # 短信通知
│       └── prisma/
│           ├── schema.prisma            # 数据库模型定义
│           └── migrations/              # 数据库迁移记录
│
├── packages/
│   ├── types/                           # 前后端共享 TypeScript 类型
│   │   └── src/
│   │       ├── user.ts
│   │       ├── product.ts
│   │       ├── order.ts
│   │       └── index.ts
│   ├── utils/                           # 共享工具函数
│   │   └── src/
│   │       ├── price.ts                 # 价格格式化（分 / 元）
│   │       ├── date.ts                  # 日期格式化
│   │       └── validator.ts             # 通用校验规则
│   └── config/                          # 共享工程配置
│       ├── tsconfig.base.json
│       └── eslint-preset.js
│
├── docs/                                # 项目文档
├── docker-compose.yml                   # 本地开发环境（MySQL + Redis）
├── package.json                         # 根 package（pnpm workspace）
├── pnpm-workspace.yaml
└── turbo.json                           # Turborepo 构建编排
```

---

## 七、数据库核心模型

```prisma
// 买家用户
model User {
  id        String     @id @default(cuid())
  phone     String     @unique
  nickname  String
  avatar    String?
  oauths    UserOAuth[]
  orders    Order[]
  addresses Address[]
  createdAt DateTime   @default(now())
}

// 多端身份绑定
model UserOAuth {
  id       String @id @default(cuid())
  userId   String
  platform String  // 'weapp' | 'tt'
  openid   String
  unionid  String?
  user     User   @relation(fields: [userId], references: [id])
  @@unique([platform, openid])
}

// 商家
model Seller {
  id       String    @id @default(cuid())
  phone    String    @unique
  shopName String
  logo     String?
  products Product[]
}

// 商品 SPU
model Product {
  id       String        @id @default(cuid())
  sellerId String
  name     String
  cover    String
  images   String[]
  detail   String        @db.Text
  status   ProductStatus @default(ON_SALE)
  skus     Sku[]
  seller   Seller        @relation(fields: [sellerId], references: [id])
}

// 商品 SKU（规格）
model Sku {
  id        String  @id @default(cuid())
  productId String
  specs     Json    // { "颜色": "红色", "尺寸": "XL" }
  price     Int     // 单位：分
  stock     Int
  product   Product @relation(fields: [productId], references: [id])
}

// 订单
model Order {
  id          String      @id @default(cuid())
  userId      String
  sellerId    String
  status      OrderStatus @default(PENDING_PAY)
  items       OrderItem[]
  address     Json        // 快照收货地址
  totalAmount Int         // 单位：分
  payAt       DateTime?
  shipAt      DateTime?
  trackingNo  String?
  createdAt   DateTime    @default(now())
}

// 订单商品行
model OrderItem {
  id        String @id @default(cuid())
  orderId   String
  skuId     String
  name      String  // 快照商品名
  specs     Json    // 快照规格
  price     Int
  quantity  Int
  order     Order  @relation(fields: [orderId], references: [id])
}

// 收货地址
model Address {
  id        String  @id @default(cuid())
  userId    String
  name      String
  phone     String
  province  String
  city      String
  district  String
  detail    String
  isDefault Boolean @default(false)
  user      User    @relation(fields: [userId], references: [id])
}

enum ProductStatus { ON_SALE OFF_SALE }
enum OrderStatus   { PENDING_PAY PENDING_SHIP SHIPPED DONE CANCELLED REFUNDING REFUNDED }
```

---

## 八、多端差异处理策略

### 登录

```typescript
// 各端获取 code，后端统一换 openid → 返回 JWT（含 role）
const { code } = await Taro.login()
const platform = process.env.TARO_ENV  // 'weapp' | 'tt'
const { token, role } = await api.post('/auth/login', { code, platform })

// 根据角色跳转
if (role === 'seller') {
  Taro.switchTab({ url: '/pages/seller/dashboard/index' })
} else {
  Taro.switchTab({ url: '/pages/home/index' })
}
```

### 支付

```typescript
if (process.env.TARO_ENV === 'weapp') {
  await Taro.requestPayment({ ...wxPayParams })
} else if (process.env.TARO_ENV === 'tt') {
  await Taro.pay({ orderInfo: ttOrderInfo })
}
```

### 订阅消息（新订单通知商家）

- 微信：调用订阅消息 API（`wx.requestSubscribeMessage`）
- 抖音：调用订阅消息 API（`tt.requestSubscribeMessage`）

---

## 九、本地开发环境

```bash
# 启动数据库和缓存（Docker）
docker-compose up -d

# 并行启动所有服务（Turborepo）
pnpm dev

# 或单独启动
pnpm dev:server   # 后端（热更新）
pnpm dev:buyer    # 买家端（默认编译微信小程序）

# 买家端多端编译
pnpm --filter @fashop/buyer dev:weapp   # 微信小程序
pnpm --filter @fashop/buyer dev:tt      # 抖音小程序
pnpm --filter @fashop/buyer dev:h5      # H5（本地调试用）
```

**本地端口规划：**

| 服务 | 端口 |
|------|------|
| 后端 API | 3000 |
| 买家端 H5（含商家页面） | 10086 |
| MySQL | 3306 |
| Redis | 6379 |

---

## 十、生产环境部署

```
服务器：    腾讯云 ECS（微信生态更顺滑）
数据库：    云数据库 RDS MySQL 8
缓存：      云数据库 Redis
文件存储：  阿里云 OSS + CDN（商品图片/视频加速）
进程管理：  PM2（Node.js 服务守护）
反向代理：  Nginx（SSL 证书 + 限流 + 静态文件）
域名：      已备案域名（微信/抖音小程序强制要求）
```

---

## 十一、开发里程碑

### 第一期：核心交易闭环（MVP）

- [ ] Monorepo 工程骨架搭建
- [ ] Docker 本地环境（MySQL + Redis）
- [ ] 后端基础框架（Hono + Prisma）
- [ ] 微信小程序登录（买家 + 商家角色识别）
- [ ] 商品发布（商家端页面）
- [ ] 商品列表 + 详情（买家端页面）
- [ ] 购物车
- [ ] 下单 + 微信支付
- [ ] 商家确认发货
- [ ] 买家查看订单

### 第二期：体验完善

- [ ] 抖音小程序适配
- [ ] 退款 / 售后
- [ ] 优惠券
- [ ] 物流查询
- [ ] 商家数据看板
- [ ] 新订单推送通知

### 第三期：增长工具

- [ ] 分享裂变
- [ ] 直播挂车
- [ ] 限时折扣
- [ ] 数据分析

---

## 十二、关键技术决策记录

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 多端框架 | Taro | React 技术栈，一套代码编译多端 |
| 商家端集成方式 | 内嵌买家端小程序 | 减少维护成本，商家无需安装额外 App |
| 后端框架 | Hono | 轻量、TypeScript 友好，对前端工程师友好 |
| ORM | Prisma | 无需手写 SQL，TypeScript 类型自动生成 |
| 状态管理 | Zustand | 轻量无样板代码，Taro 兼容好 |
| UI 组件库 | NutUI-React | 京东出品，专为 Taro 设计 |
| Monorepo 工具 | pnpm + Turborepo | 依赖共享 + 并行构建 |
| 图片存储 | 阿里云 OSS 直传 | 不走服务器带宽，节省成本 |
| 本地数据库 | Docker | 环境隔离，不污染本地，换电脑秒恢复 |
