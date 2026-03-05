---
name: fashop-fullstack
description: FaShop 全栈功能开发规范：前后端联动新增页面和接口。涵盖 buyer（Taro + React）页面开发、server（Hono + Prisma）接口开发、共享类型声明、主题样式、登录态处理的完整流程。当用户需要新增页面、添加功能模块、前后端联调时使用。
---

# FaShop 全栈功能开发规范

## 技术栈速查

| 层 | 技术 | 路径 |
|----|------|------|
| 买家端 | Taro 4 + React 18 + Tailwind CSS v4 | `apps/buyer/` |
| 服务端 | Hono + Prisma（MySQL）+ Redis | `apps/server/` |
| 共享类型 | `declare namespace` 全局注入 | `packages/types/src/*.d.ts` |
| 共享校验 | Zod schema + ambient `.d.ts` | `packages/schema/src/` |

---

## 一、新增功能的标准流程

```
1. 定义类型    → packages/types/src/xxx.d.ts（declare namespace）
2. 创建接口    → apps/server/src/routes/xxx.ts → 注册到 app.ts
3. 创建页面    → apps/buyer/src/pages/xxx/ → 注册到 app.config.ts
4. 联调验证
```

---

## 二、共享类型声明

### 规则

- 放在 `packages/types/src/` 下，使用 `.d.ts` 文件
- 用 `declare namespace` 全局注入，前后端**无需 import** 直接使用
- 已有示例：`Auth.LoginParams`、`User.Profile`

### 模板

```typescript
// packages/types/src/xxx.d.ts
declare namespace Xxx {
  interface Detail {
    id: string
    name: string
  }

  interface ListItem {
    id: string
    name: string
    cover: string
  }
}
```

### 类型如何生效

- **buyer**：`tsconfig.json` 的 `include` 已包含 `../../packages/types/src/**/*.d.ts`
- **server**：通过 `src/global.d.ts` 的 triple-slash reference 引入（因 `declaration: true` 不能直接 include）

```typescript
// apps/server/src/global.d.ts — 新增类型文件后需要在此添加引用
/// <reference path="../../packages/types/src/xxx.d.ts" />
```

---

## 三、服务端接口开发

详细规范参见 `fashop-api` skill，此处补充联动要点。

### 新建路由文件模板

```typescript
// apps/server/src/routes/xxx.ts
import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { userAuth } from '../middlewares/auth.js'

export const xxxRoutes = new Hono()

xxxRoutes.get('/detail', userAuth, async (c) => {
  const userId = c.get('jwtPayload').sub
  // Prisma 查询 + select 控制返回字段
  const item = await prisma.xxx.findUnique({
    where: { id },
    select: { id: true, name: true },
  })
  if (!item) return c.json({ code: 404, message: 'xxx 不存在' }, 404)
  return c.json({ code: 0, message: 'ok', data: item })
})
```

### 注册路由

```typescript
// apps/server/src/app.ts
import { xxxRoutes } from './routes/xxx.js'
api.route('/xxx', xxxRoutes)
```

---

## 四、买家端页面开发

### 页面文件结构

```
apps/buyer/src/pages/xxx/
├── index.tsx          # 页面组件
└── index.config.ts    # 页面配置
```

### 页面配置模板

```typescript
// index.config.ts
export default definePageConfig({
  navigationBarTitleText: '页面标题',
  // 有背景图/自定义头部时：
  // navigationStyle: 'custom',
})
```

### 注册页面

```typescript
// apps/buyer/src/app.config.ts  pages 数组添加
'pages/xxx/index',
```

### 组件与样式规范

- 使用 `@tarojs/components`：`View`、`Text`、`Image`、`Input`、`ScrollView` 等
- 样式用 **Tailwind CSS** 类名，不写独立样式文件
- 主题色通过 `app.css` 的 `@theme` 定义，类名中使用 `primary` 系列：

```
bg-primary  text-primary  border-primary
bg-primary-400  text-primary-600  ...
```

主题色色阶（橙色系）：

| Token | 值 |
|-------|----|
| `primary-50` | #fff8e6 |
| `primary-100` | #ffe8b5 |
| `primary-200` | #ffd78c |
| `primary-300` | #ffc363 |
| `primary-400` | #ffad3b |
| `primary` | #f28d12 |
| `primary-600` | #cc6b04 |
| `primary-700` | #a65000 |
| `primary-800` | #803900 |
| `primary-900` | #592500 |

### 请求工具

```typescript
import { get, post, put, del } from '../../utils/request'

const data = await get<Xxx.Detail>('/api/xxx/detail', { id })
const result = await post<Xxx.CreateResult>('/api/xxx/create', body)
```

- 自动携带 `Authorization: Bearer <token>`
- 401 自动清 token 并跳转登录页（被动跳转，用 `redirectTo`）

### 登录态处理模式

```typescript
import { getLocalSync, STORE_KEY } from '../../utils/local-storage'

// 判断登录态（本地优先，零请求）
const token = getLocalSync<string>(STORE_KEY.TOKEN)
if (token) {
  // 已登录 → 请求接口
} else {
  // 未登录 → 展示引导 UI
}

// 主动跳转登录（保留页面栈，登录后可回退）
Taro.navigateTo({ url: '/pages/login/index?from=xxx' })

// 登录页已支持 from 参数：有 from → navigateBack()，无 from → switchTab 首页
```

### 页面生命周期

| Hook | 用途 |
|------|------|
| `useLoad` | 首次加载，适合一次性初始化 |
| `useDidShow` | 每次页面展示（含返回），适合需要刷新的数据 |

---

## 五、前后端联动检查清单

新增一个完整功能时，按顺序检查：

- [ ] `packages/types/src/` — 新建或更新 `.d.ts` 类型声明
- [ ] `apps/server/src/global.d.ts` — 添加 triple-slash reference
- [ ] `apps/server/src/routes/` — 新建路由文件
- [ ] `apps/server/src/app.ts` — 注册路由
- [ ] `apps/buyer/src/pages/` — 新建页面目录（`index.tsx` + `index.config.ts`）
- [ ] `apps/buyer/src/app.config.ts` — 注册页面路径
- [ ] 接口请求使用 `utils/request` 的 `get/post/put/del`
- [ ] 类型使用 namespace 全局类型（如 `User.Profile`），无需 import
