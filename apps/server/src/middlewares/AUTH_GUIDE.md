# JWT 认证指南

> 本文档基于 FaShop 项目的认证实现，帮助你理解 JWT 是什么、为什么用它、怎么用它。

---

## 一、什么是 JWT

JWT（JSON Web Token）是一种用于身份认证的令牌格式。登录成功后，服务端签发一个 token 给客户端，之后客户端每次请求携带这个 token，服务端通过验证 token 来确认"你是谁"。

一个 JWT 由三部分组成，用 `.` 分隔：

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEiLCJyb2xlIjoidXNlciJ9.xxxxxx
│       Header       │           Payload            │  Signature  │
│    签名算法声明      │    载荷（用户ID、角色等）       │   签名验证   │
```

- **Header**：声明算法类型（如 HS256）
- **Payload**：携带业务数据（如用户 ID、角色），Base64 编码，**不是加密**，任何人都能解码读取
- **Signature**：用密钥对前两部分签名，防止篡改

> 重点：JWT 保证的是"没人能篡改"，而不是"没人能看到"。不要在 payload 中放密码等敏感信息。

---

## 二、为什么 FaShop 选择 JWT

### 1. 多端适配

FaShop 同时支持微信小程序、抖音小程序和 H5。小程序没有浏览器的 cookie 机制，传统的 Session 方案用起来很别扭。JWT 只需要在请求头带上 `Authorization: Bearer <token>`，三端实现完全一致。

### 2. 无状态

服务端不需要存储会话信息（不依赖 Redis/数据库记录登录状态）。token 本身包含了所有认证信息，`jwt.verify()` 纯靠密钥计算即可验证，速度极快。

### 3. 角色系统轻量实现

JWT payload 中直接携带 `role` 字段，中间件解码后即可判断买家/商家身份，无需额外查数据库。

### 4. 实现简单

单人全栈项目，一个 `JWT_SECRET` 环境变量 + 一个 `signToken` 函数 + 两个中间件，总共 65 行代码搞定全部认证。

---

## 三、jsonwebtoken 库的三个核心方法

### `jwt.sign(payload, secret, options)` —— 签发 Token

将载荷数据签名生成 JWT 字符串。用于登录成功后颁发 token。

```typescript
const token = jwt.sign(
  { sub: 'user_1', role: 'user' },
  process.env.JWT_SECRET!,
  { expiresIn: '30d' }
)
```

常用 options：

| 选项 | 说明 | 示例 |
|------|------|------|
| `expiresIn` | 过期时间 | `'30d'`, `'2h'`, `60`（秒） |
| `algorithm` | 签名算法 | `'HS256'`（默认） |

### `jwt.verify(token, secret)` —— 验证 Token

验证签名是否合法、是否过期，并返回解码后的 payload。**鉴权必须用它。**

```typescript
try {
  const payload = jwt.verify(token, process.env.JWT_SECRET!)
  // { sub: 'user_1', role: 'user', iat: ..., exp: ... }
} catch (err) {
  // TokenExpiredError → token 已过期
  // JsonWebTokenError → token 格式错误或签名不匹配
}
```

### `jwt.decode(token)` —— 解码 Token（不验证）

仅解码 payload，**不校验签名，不验证过期**。

```typescript
const payload = jwt.decode(token)
```

**适用场景：**

- 前端解析 token 获取用户信息（前端没有密钥，无法 verify）
- 日志中间件提取请求者身份（不需要因 token 过期而拒绝记录）
- 检查 token 剩余有效期，决定是否续签

> 绝对不能用 `decode` 做鉴权判断，鉴权必须用 `verify`。

---

## 四、签名算法选择

JWT 的签名算法分两大类：

### 对称算法（HMAC 系列）

签名和验证用**同一个密钥**。

| 算法 | 说明 |
|------|------|
| HS256 | 默认，最常用，FaShop 在用 |
| HS384 / HS512 | 更长的密钥，安全等级更高 |

适合：签发和验证是同一个服务（或少数完全信任的服务）。

### 非对称算法（RSA / ECDSA / EdDSA）

用**私钥**签名，用**公钥**验证。持有公钥的服务只能验签，无法伪造 token。

| 算法 | 说明 |
|------|------|
| RS256 | 最通用的非对称算法，微服务/SSO 标配 |
| ES256 | 更快更短，Apple 登录在用 |
| EdDSA | 最新最快的非对称算法 |

适合：签发和验证是不同的服务（如独立的认证中心 + 多个微服务）。

**FaShop 用 HS256 的原因：** 只有一个 Hono 后端，自签自验，HS256 简单高效。未来如果拆微服务，再考虑换 RS256 或 ES256。

---

## 五、认证 vs 授权

日常说的"权限认证"其实包含两个不同的步骤：

| 步骤 | 解决的问题 | 对应代码 | 失败时返回 |
|------|-----------|---------|-----------|
| **认证（Authentication）** | 你是谁？ | `jwt.verify(token, secret)` | 401 Unauthorized |
| **授权（Authorization）** | 你能干什么？ | `payload.role !== 'seller'` | 403 Forbidden |

类比：刷工卡进公司（认证）→ 检查你有没有机房权限（授权）。

在 `auth.ts` 中，`userAuth` 和 `sellerAuth` 中间件一步完成了这两件事——先 verify 确认身份，再检查 role 判断权限。

---

## 六、常见认证方案对比

| 方案 | 复杂度 | 适合客户端 | 最佳场景 |
|------|--------|-----------|---------|
| **JWT** | 低 | 多端通用 | **小程序、移动 App、前后端分离（FaShop 在用）** |
| Session + Cookie | 低 | 浏览器 | 传统 Web 后台管理系统 |
| OAuth 2.0 | 高 | 多端通用 | 开放平台、第三方登录、SSO |
| API Key | 极低 | 服务端 | 开放 API、服务间调用 |
| HTTP Basic | 极低 | 浏览器/CLI | 内部工具、临时接口保护 |
| SSO | 高 | 浏览器为主 | 企业多系统统一登录 |
| mTLS | 极高 | 服务端 | 微服务通信、金融级安全 |

---

## 七、Token 自动续签策略

### 问题

token 有效期固定为 N 天，到期后用户必须重新登录。希望实现：**用户活跃期间自动延长，只有长期不用才需要重新登录。**

### FaShop 采用的方案：静默刷新

**配置：** token 有效期 30 天，剩余不足 7 天时自动续签。

**效果：**

```
Day 1:  登录，获得 30 天有效 token
Day 20: 使用 → 剩 10 天 > 7 天 → 不刷新
Day 24: 使用 → 剩 6 天 < 7 天 → 自动续签 → 重置为 30 天
...只要每 30 天内活跃一次，永远不会过期
```

**实现方式：**

后端中间件：认证通过后检查 token 剩余有效期，不足 7 天时在响应头返回新 token。

```typescript
// 续签中间件
const autoRefresh = createMiddleware(async (c, next) => {
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
```

前端响应拦截器：检测到新 token 时自动替换。

```typescript
const newToken = response.header['X-New-Token']
if (newToken) {
  Taro.setStorageSync('token', newToken)
}
```

### 为什么选这个方案

| | 静默刷新 | Refresh Token | 滑动过期 |
|---|---|---|---|
| 实现复杂度 | **低** | 高 | 最低 |
| 安全性 | 中 | 高 | 中 |
| 能否踢人下线 | 不能 | 能 | 不能 |
| 额外存储 | **不需要** | 需要 Redis | **不需要** |
| 性能开销 | **低（快过期才续签）** | 低 | 高（每次都签） |

静默刷新最适合 FaShop 当前阶段：单人开发、单服务架构、小程序环境 token 泄露风险低。未来如果需要"踢人下线"等功能，再升级为 Refresh Token 方案。

---

## 八、本项目代码结构

```
apps/server/src/middlewares/auth.ts

├── JwtPayload 接口     ← token 载荷类型定义
├── userAuth 中间件      ← 买家接口认证（验证 token + 检查 role = 'user'）
├── sellerAuth 中间件    ← 商家接口认证（验证 token + 检查 role = 'seller'）
└── signToken 函数       ← 签发 token 的工具函数
```

**使用方式：**

```typescript
// 公开接口 —— 不加中间件
app.get('/products/:id', handler)

// 买家接口 —— 加 userAuth
app.post('/orders', userAuth, handler)

// 商家接口 —— 加 sellerAuth
app.get('/seller/orders', sellerAuth, handler)
```

**环境变量（.env.local）：**

| 变量 | 说明 | 示例 |
|------|------|------|
| `JWT_SECRET` | 签名密钥，必须保密 | 一段随机字符串 |
| `JWT_EXPIRES_IN` | token 有效期 | `30d` |
