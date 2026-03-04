# Tailwind CSS 使用指南（Taro + Tailwind CSS v4）

## 一、项目集成架构

本项目使用 **Taro 4 + Vite + Tailwind CSS v4 + weapp-tailwindcss** 的技术栈，同时支持 **H5** 和 **微信小程序** 等多端。

### 依赖说明

| 包名 | 作用 |
|---|---|
| `tailwindcss` | Tailwind CSS v4 核心引擎 |
| `@tailwindcss/postcss` | PostCSS 插件，将 Tailwind 指令编译为标准 CSS |
| `weapp-tailwindcss` | 小程序端兼容，处理类名中 `[]`、`:`、`.` 等特殊字符 |
| `@weapp-tailwindcss/merge` | 运行时工具，用于动态合并 Tailwind 类名 |

### 配置文件一览

```
apps/buyer/
├── config/index.ts       # Taro 构建配置（Vite 插件注入）
├── src/app.css            # Tailwind CSS 入口 + 主题配置
└── src/app.ts             # 应用入口（导入 app.css）
```

### 核心配置（config/index.ts）

```typescript
import { UnifiedViteWeappTailwindcssPlugin } from 'weapp-tailwindcss/vite'
import tailwindcss from '@tailwindcss/postcss'

compiler: {
  type: 'vite',
  vitePlugins: [
    // 1. 将 @tailwindcss/postcss 注入 PostCSS 流水线
    {
      name: 'postcss-config-loader-plugin',
      config(config) {
        if (typeof config.css?.postcss === 'object') {
          config.css?.postcss.plugins?.unshift(tailwindcss())
        }
      },
    },
    // 2. 小程序端类名兼容 + rem→rpx 自动转换
    UnifiedViteWeappTailwindcssPlugin({
      rem2rpx: true,
      cssEntries: [path.resolve(__dirname, '../src/app.css')]
    })
  ]
}
```

### CSS 入口（src/app.css）

```css
@import 'tailwindcss';

@theme {
  --color-primary-50: #fff8e6;
  --color-primary: #f28d12;
  /* ... 更多色阶 */
}
```

---

## 二、Tailwind CSS v4 核心概念

### 2.1 什么是 Utility-First（工具优先）

Tailwind 不提供预制组件，而是提供大量**原子化工具类**，直接在 HTML/JSX 的 `className` 中组合使用：

```tsx
// 传统方式：写 CSS 类 → 再引用
// Tailwind 方式：直接用工具类描述样式
<View className="flex items-center p-4 bg-white rounded-lg shadow-md">
  <Text className="text-lg font-bold text-primary">标题</Text>
</View>
```

### 2.2 CSS-First 配置（v4 新特性）

Tailwind v4 抛弃了 `tailwind.config.js`，改用 **CSS 原生语法** 配置，所有定制都在 `app.css` 中完成：

```css
@import 'tailwindcss';

@theme {
  /* 定义设计令牌（Design Tokens） */
  --color-brand: #f28d12;
  --font-size-hero: 3rem;
  --spacing-section: 4rem;
}
```

定义后自动生成对应工具类：`bg-brand`、`text-hero`、`p-section` 等。

---

## 三、常用工具类速查

### 3.1 布局

| 类名 | 效果 | 等价 CSS |
|---|---|---|
| `flex` | 弹性布局 | `display: flex` |
| `grid` | 网格布局 | `display: grid` |
| `block` / `inline` / `hidden` | 显示模式 | `display: block / inline / none` |
| `items-center` | 交叉轴居中 | `align-items: center` |
| `justify-center` | 主轴居中 | `justify-content: center` |
| `justify-between` | 两端对齐 | `justify-content: space-between` |
| `flex-col` | 纵向排列 | `flex-direction: column` |
| `flex-row` | 横向排列 | `flex-direction: row` |
| `flex-wrap` | 换行 | `flex-wrap: wrap` |
| `flex-1` | 弹性填充 | `flex: 1` |
| `gap-4` | 间距 | `gap: 1rem` |

### 3.2 间距（Spacing）

Tailwind 使用 **4px 为基础单位**（1 单位 = 0.25rem = 4px）：

| 类名 | 值 | 说明 |
|---|---|---|
| `p-0` | 0 | 无内边距 |
| `p-1` | 0.25rem (4px) | — |
| `p-2` | 0.5rem (8px) | — |
| `p-4` | 1rem (16px) | 常用 |
| `p-6` | 1.5rem (24px) | — |
| `p-8` | 2rem (32px) | — |
| `px-4` | 水平方向 1rem | padding-left + padding-right |
| `py-2` | 垂直方向 0.5rem | padding-top + padding-bottom |
| `pt-4` | 顶部 1rem | padding-top |
| `m-4` | 外边距 1rem | margin（同理 mx/my/mt/mr/mb/ml） |
| `m-auto` | 自动居中 | margin: auto |

> 同样的数值规则适用于 `m-*`（margin）、`w-*`（width）、`h-*`（height）、`gap-*` 等。

### 3.3 尺寸

| 类名 | 效果 |
|---|---|
| `w-full` | 宽度 100% |
| `w-screen` | 宽度 100vw |
| `w-1/2` | 宽度 50% |
| `w-64` | 宽度 16rem (256px) |
| `h-screen` | 高度 100vh |
| `min-h-screen` | 最小高度 100vh |
| `max-w-md` | 最大宽度 28rem |
| `size-10` | 宽高同时设为 2.5rem |

### 3.4 文字

| 类名 | 效果 |
|---|---|
| `text-xs` | 字号 0.75rem |
| `text-sm` | 字号 0.875rem |
| `text-base` | 字号 1rem（默认） |
| `text-lg` | 字号 1.125rem |
| `text-xl` ~ `text-9xl` | 逐级增大 |
| `font-normal` | 字重 400 |
| `font-medium` | 字重 500 |
| `font-semibold` | 字重 600 |
| `font-bold` | 字重 700 |
| `text-center` | 文字居中 |
| `text-left` / `text-right` | 文字对齐 |
| `leading-tight` | 行高 1.25 |
| `leading-relaxed` | 行高 1.625 |
| `truncate` | 单行截断省略号 |
| `line-clamp-2` | 多行截断（2行） |

### 3.5 颜色

颜色类适用于文字、背景、边框等，格式统一：

```
{属性}-{颜色}-{色阶}
```

```tsx
<Text className="text-primary">主题色文字</Text>
<View className="bg-primary-50">浅色背景</View>
<View className="border border-primary-300">主题色边框</View>
```

**本项目自定义色板（primary 系列）：**

| 类名后缀 | 色值 | 用途建议 |
|---|---|---|
| `primary-50` | #fff8e6 | 极浅背景 |
| `primary-100` | #ffe8b5 | 浅色背景 / hover |
| `primary-200` | #ffd78c | 次要背景 |
| `primary-300` | #ffc363 | 边框 / 分隔线 |
| `primary-400` | #ffad3b | 次要按钮 |
| `primary` | #f28d12 | **主题色**（按钮、链接、强调） |
| `primary-600` | #cc6b04 | hover / active 状态 |
| `primary-700` | #a65000 | 深色强调 |
| `primary-800` | #803900 | 深色文字 |
| `primary-900` | #592500 | 极深色 |

**Tailwind 内置颜色**同样可用：`gray`、`red`、`blue`、`green`、`yellow`、`purple` 等，每种 50~950 共 11 个色阶。

### 3.6 边框与圆角

| 类名 | 效果 |
|---|---|
| `border` | 1px 边框 |
| `border-2` | 2px 边框 |
| `border-primary` | 主题色边框 |
| `border-t` / `border-b` | 仅上/下边框 |
| `rounded` | 圆角 0.25rem |
| `rounded-md` | 圆角 0.375rem |
| `rounded-lg` | 圆角 0.5rem |
| `rounded-xl` | 圆角 0.75rem |
| `rounded-2xl` | 圆角 1rem |
| `rounded-full` | 完全圆形 |

### 3.7 阴影与透明度

| 类名 | 效果 |
|---|---|
| `shadow-sm` | 小阴影 |
| `shadow` | 标准阴影 |
| `shadow-md` | 中等阴影 |
| `shadow-lg` | 大阴影 |
| `opacity-50` | 50% 透明度 |
| `opacity-0` | 完全透明 |

### 3.8 过渡与动画

| 类名 | 效果 |
|---|---|
| `transition` | 默认过渡（color, background, border, shadow, transform） |
| `transition-colors` | 仅颜色过渡 |
| `duration-150` | 过渡时长 150ms |
| `duration-300` | 过渡时长 300ms |
| `ease-in-out` | 缓入缓出 |

---

## 四、响应式与状态变体

### 4.1 响应式前缀（H5 端）

```tsx
<View className="p-4 md:p-8 lg:p-12">
  {/* 默认 p-4，中屏 p-8，大屏 p-12 */}
</View>
```

| 前缀 | 最小宽度 |
|---|---|
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |
| `2xl:` | 1536px |

> 注意：响应式前缀主要用于 H5 端，小程序端屏幕尺寸固定，通常不需要。

### 4.2 状态变体

```tsx
<View className="bg-primary hover:bg-primary-600 active:bg-primary-700">
  按钮
</View>

<Input className="border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary-200" />
```

| 前缀 | 触发条件 |
|---|---|
| `hover:` | 鼠标悬停（H5） |
| `focus:` | 获得焦点 |
| `active:` | 按下 |
| `disabled:` | 禁用状态 |
| `first:` / `last:` | 首个/末个子元素 |

### 4.3 暗色模式

```tsx
<View className="bg-white dark:bg-gray-900">
  <Text className="text-gray-900 dark:text-white">自适应文字</Text>
</View>
```

---

## 五、在 Taro 中使用的注意事项

### 5.1 使用 Taro 组件而非 HTML 标签

Taro 中必须使用 `@tarojs/components` 的组件，不能直接写 `<div>`、`<span>` 等：

```tsx
// ✅ 正确
import { View, Text, Image, Input, Button } from '@tarojs/components'
<View className="flex p-4">
  <Text className="text-lg">内容</Text>
</View>

// ❌ 错误（小程序端不支持）
<div className="flex p-4">
  <span className="text-lg">内容</span>
</div>
```

### 5.2 使用 className 而非 class

React + Taro 中统一使用 `className`：

```tsx
<View className="bg-primary text-white p-4 rounded-lg">按钮</View>
```

### 5.3 动态类名

使用模板字符串或第三方工具拼接类名：

```tsx
// 模板字符串
<View className={`p-4 ${isActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
  内容
</View>

// 使用 @weapp-tailwindcss/merge（已安装）
import { twMerge } from '@weapp-tailwindcss/merge'

<View className={twMerge('p-4 bg-gray-100', isActive && 'bg-primary text-white')}>
  内容
</View>
```

`twMerge` 能智能合并冲突类名（如 `bg-gray-100` 与 `bg-primary` 冲突时保留后者）。

### 5.4 小程序端特殊字符限制

微信小程序不支持类名中的 `[]`、`:`、`.`、`/` 等字符。`weapp-tailwindcss` 插件会自动转换：

```
text-[#ff0000]  →  text--_h_ff0000_-   （自动处理）
hover:bg-red    →  hover_c_bg-red       （自动处理）
w-1/2           →  w-1_d_2              （自动处理）
```

开发时正常书写 Tailwind 类名即可，无需手动处理。

### 5.5 任意值（Arbitrary Values）

当内置工具类不满足需求时，使用方括号语法：

```tsx
<View className="w-[200px] h-[100px] bg-[#f5f5f5] text-[14px] mt-[20px]">
  自定义尺寸
</View>
```

---

## 六、自定义主题扩展

所有主题定制都在 `src/app.css` 的 `@theme` 块中完成：

### 6.1 添加自定义颜色

```css
@theme {
  --color-success: #22c55e;
  --color-danger: #ef4444;
  --color-warning: #f59e0b;
  --color-info: #3b82f6;
}
```

使用：`bg-success`、`text-danger`、`border-warning`。

### 6.2 添加自定义字号

```css
@theme {
  --font-size-hero: 2.5rem;
  --font-size-caption: 0.625rem;
}
```

使用：`text-hero`、`text-caption`。

### 6.3 添加自定义间距

```css
@theme {
  --spacing-page: 1.25rem;
  --spacing-card: 0.75rem;
}
```

使用：`p-page`、`m-card`、`gap-page`。

### 6.4 添加自定义圆角

```css
@theme {
  --radius-card: 0.75rem;
  --radius-button: 0.5rem;
}
```

使用：`rounded-card`、`rounded-button`。

---

## 七、常见 UI 模式示例

### 卡片

```tsx
<View className="bg-white rounded-xl shadow-md p-4">
  <Text className="text-lg font-bold text-gray-900">卡片标题</Text>
  <Text className="text-sm text-gray-500 mt-2">卡片描述内容</Text>
</View>
```

### 按钮

```tsx
<View className="bg-primary rounded-lg px-6 py-3 text-center">
  <Text className="text-white font-semibold text-base">主要按钮</Text>
</View>

<View className="border border-primary rounded-lg px-6 py-3 text-center">
  <Text className="text-primary font-semibold text-base">次要按钮</Text>
</View>
```

### 列表项

```tsx
<View className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
  <View className="flex items-center gap-3">
    <Image className="size-10 rounded-full" src={avatar} />
    <View>
      <Text className="text-base font-medium text-gray-900">用户名</Text>
      <Text className="text-sm text-gray-500">描述信息</Text>
    </View>
  </View>
  <Text className="text-sm text-gray-400">{'>'}</Text>
</View>
```

### 标签/徽章

```tsx
<View className="inline-flex bg-primary-50 rounded-full px-3 py-1">
  <Text className="text-xs font-medium text-primary">热门</Text>
</View>
```

### 价格展示

```tsx
<View className="flex items-baseline gap-1">
  <Text className="text-xs text-primary">¥</Text>
  <Text className="text-2xl font-bold text-primary">99</Text>
  <Text className="text-sm text-gray-400 line-through">¥199</Text>
</View>
```

---

## 八、参考链接

- [Tailwind CSS v4 官方文档](https://tailwindcss.com/docs)
- [Taro 官方文档](https://taro-docs.jd.com/docs/)
- [weapp-tailwindcss 文档](https://weapp-tw.icebreaker.top/)
- [Taro + Tailwind CSS v4 模板](https://github.com/icebreaker-template/taro-vite-tailwindcss-v4)
