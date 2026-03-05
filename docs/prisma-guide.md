# Prisma 快速入门指南

本文档基于 FaShop 项目实际代码，总结 Prisma ORM 的核心用法。

## 核心文件

| 文件 | 作用 |
|---|---|
| `prisma/schema.prisma` | 定义数据模型、关联关系、枚举 |
| `prisma/migrations/` | 数据库迁移记录 |
| `src/lib/prisma.ts` | 导出 `prisma` 客户端实例 |

## 常用命令

```bash
# 修改 schema 后，生成迁移并同步数据库
npx prisma migrate dev --name add_xxx

# 只重新生成客户端（不改表结构时）
npx prisma generate

# 打开可视化数据库管理界面
npx prisma studio
```

## 访问规则

Prisma Client 的属性名是 **模型名的小驼峰形式**：

| Schema 中的模型名 | Prisma Client 访问方式 |
|---|---|
| `model User` | `prisma.user` |
| `model Order` | `prisma.order` |
| `model OrderItem` | `prisma.orderItem` |
| `model ProductCategory` | `prisma.productCategory` |

## CRUD 操作

### 创建

```typescript
const user = await prisma.user.create({
  data: { phone: '13800138000', nickname: '张三' },
})
```

对应 SQL：`INSERT INTO users (phone, nickname) VALUES ('13800138000', '张三')`

### 查询单条

```typescript
const user = await prisma.user.findUnique({ where: { id: 'xxx' } })
```

> `findUnique` 只能用 `@id` 或 `@unique` 字段（如 `id`、`phone`）

对应 SQL：`SELECT * FROM users WHERE id = 'xxx' LIMIT 1`

### 查询多条（条件 + 排序 + 分页）

```typescript
const orders = await prisma.order.findMany({
  where: { userId: 'xxx', status: 'PENDING_PAY' },
  orderBy: { createdAt: 'desc' },
  skip: 0,
  take: 10,
})
```

对应 SQL：`SELECT * FROM orders WHERE user_id = 'xxx' AND status = 'PENDING_PAY' ORDER BY created_at DESC LIMIT 10 OFFSET 0`

### 更新

```typescript
await prisma.order.update({
  where: { id: 'xxx' },
  data: { status: 'SHIPPED', trackingNo: 'SF123456' },
})
```

对应 SQL：`UPDATE orders SET status = 'SHIPPED', tracking_no = 'SF123456' WHERE id = 'xxx'`

### 删除

```typescript
await prisma.address.delete({ where: { id: 'xxx' } })
```

对应 SQL：`DELETE FROM addresses WHERE id = 'xxx'`

## 字段控制

### select — 只返回指定字段

```typescript
const user = await prisma.user.findUnique({
  where: { id },
  select: { id: true, phone: true, nickname: true, createdAt: true },
})
```

对应 SQL：`SELECT id, phone, nickname, created_at FROM users WHERE id = '...' LIMIT 1`

### omit — 排除指定字段（Prisma 5.16+）

```typescript
const user = await prisma.user.findUnique({
  where: { id },
  omit: { password: true },
})
```

对应 SQL：`SELECT id, phone, nickname, avatar, created_at, updated_at FROM users WHERE id = '...' LIMIT 1`

> `omit` 和 `select` 在 SQL 层面等价，都是显式列出字段（SQL 没有 `SELECT * EXCEPT` 语法）。区别在于：
>
> - `omit`：写不要的字段，表新增字段时自动包含，适合只想排除少量字段（如 `password`）的场景
> - `select`：写需要的字段，表新增字段时不会自动包含，适合只需要少量特定字段的场景

### JavaScript 层面剔除字段

当查询时需要某个字段（如登录时需要 `password` 做比对），但返回给前端时要排除，可以用解构：

```typescript
const user = await prisma.user.findUnique({ where: { phone } })
// 校验密码...
const { password: _, ...userData } = user
return c.json({ data: { user: userData } })
```

## 关联查询

### include — 查询关联数据

```typescript
// 查用户并带出所有订单和地址
const user = await prisma.user.findUnique({
  where: { id: 'xxx' },
  include: { orders: true, addresses: true },
})
// user.orders → Order[]
// user.addresses → Address[]
```

对应 SQL：通过 `LEFT JOIN` 查询关联表

### 嵌套关联

```typescript
// 查订单 → 订单项 → SKU
const order = await prisma.order.findUnique({
  where: { id: 'xxx' },
  include: {
    items: {
      include: { sku: true },
    },
  },
})
// order.items[0].sku.price
```

## Prisma ↔ SQL 速查表

| Prisma | SQL |
|---|---|
| `findUnique({ where: { id } })` | `SELECT * FROM table WHERE id = ? LIMIT 1` |
| `findMany({ where: { status: 'DONE' } })` | `SELECT * FROM table WHERE status = 'DONE'` |
| `create({ data: {...} })` | `INSERT INTO table (...) VALUES (...)` |
| `update({ where, data })` | `UPDATE table SET ... WHERE id = ?` |
| `delete({ where })` | `DELETE FROM table WHERE id = ?` |
| `include: { orders: true }` | `LEFT JOIN orders ON ...` |
| `orderBy: { createdAt: 'desc' }` | `ORDER BY created_at DESC` |
| `skip: 10, take: 5` | `LIMIT 5 OFFSET 10` |
| `select: { id: true, name: true }` | `SELECT id, name FROM table` |
| `omit: { password: true }` | `SELECT (除 password 外的所有列) FROM table` |

## 参考资料

- [Prisma 官方文档](https://www.prisma.io/docs)
- [Prisma Client API 参考](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
