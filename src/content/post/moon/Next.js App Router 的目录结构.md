---
title: Next.js App Router 的目录结构
description: 梳理 App Router 的特殊文件、路由约定与高级组织模式：layout/page/loading/not-found/error、动态与可选路径、路由组、私有文件夹与并行路由等。
publishDate: 2025-07-21
tags:
  - Next.js
  - 路由
draft: false
---
### 一、关键特殊文件（Special Files）
这些文件用于在特定路由段中创建 UI。它们必须使用 `.js`, `.jsx`, 或 `.tsx` 扩展名。
|文件名|用途|
|---|---|
|`**layout.js**`|**布局文件**。定义该路由段及其所有子路由共享的 UI。它必须接收一个 `children` prop 来渲染子页面或子布局。**同一个路由段中** `**layout**` **和** `**page**` **是必需的搭档。** 根目录 `app/layout.js` 是必须的，它会包裹整个应用。|
|`**page.js**`|**页面文件**。定义该路由段独有的 UI，是路由的可访问端点。一个文件夹要成为可访问的路由，必须包含 `page.js`。|
|`**loading.js**`|**加载中 UI**。当该路由段及其子组件正在加载时，自动显示的加载界面。它利用 React Suspense 实现。|
|`**not-found.js**`|**404 页面**。当在当前路由段或其子路由中找不到任何内容时（例如调用 `notFound()` 函数或访问无效 URL），会渲染此 UI。|
|`**error.js**`|**错误 UI**。用于捕获当前路由段及其子组件中发生的 **运行时错误**，并显示一个备用 UI。它利用 React Error Boundary 实现，并且必须是一个客户端组件 (`'use client'`)。|
|`**template.js**`|**模板文件**。与 `layout.js` 类似，但它在每次导航时都会创建一个新的实例，状态不会被保留。而 `layout` 会保留状态。使用场景较少，通常用于需要进入/退出动画的场景。|
|`**default.js**`|**默认页面（用于并行路由）**。当你在使用并行路由时，如果某个插槽（slot）无法匹配当前 URL，Next.js 会渲染这个 `default.js` 文件作为后备 UI。|
|`**route.js**`|**API 端点**。用于在服务器端创建 API 路由，替代了 `pages/api` 的功能。你可以在其中导出 `GET`, `POST`, `PUT`, `DELETE` 等 HTTP 方法对应的函数。|
---
### 二、路由约定（Routing Conventions）
文件夹的命名方式决定了 URL 的结构。
|文件夹命名|示例|映射的 URL|
|---|---|---|
|**静态路由**|`app/dashboard`|`/dashboard`|
|**动态路由**|`app/blog/[slug]`|`/blog/post-1`, `/blog/another-post`|
|**Catch-all 路由**|`app/shop/[...slug]`|`/shop/a`, `/shop/a/b`, `/shop/a/b/c`|
|**可选 Catch-all 路由**|`app/docs/[[...slug]]`|`/docs`, `/docs/a`, `/docs/a/b`|
---
### 三、组织和高级模式
|模式|描述|
|---|---|
|**文件共置 (Colocation)**|你可以在路由文件夹内部放置任何非路由文件，如组件 (`components/`)、样式 (`styles.css`)、测试文件等。这些文件不会影响路由，使得项目组织更内聚。|
|**私有文件夹 (Private Folders)**|以 `_` 开头的文件夹（例如 `_components`）被视为私有文件夹，它和里面的所有内容都不会被计入路由。非常适合用来存放仅供同级或子级路由使用的内部组件。|
|**路由组 (Route Groups)**|用括号 `()` 包裹的文件夹（例如 `(marketing)`）可以用来组织路由，但 **不会** 影响 URL 路径。这对于为不同部分应用不同布局或进行项目组织非常有用。例如 `app/(marketing)/about/page.js` 仍然映射到 `/about`。|
|**并行路由 (Parallel Routes)**|以 `@` 开头的文件夹（例如 `@team`, `@analytics`）定义了“插槽”（slots）。你可以在同一个布局中同时渲染多个页面。这些插槽作为 props 传递给 `layout.js`。例如，在仪表盘中同时显示团队信息和分析图表。|
---
### 四、一个完整的示例目录结构
下面是一个综合性的项目结构示例，以帮助你更好地理解。
```Plain
.
└── app/
    ├── _components/                # 1. 私有文件夹：存放共享组件，不会成为路由
    │   ├── Button.tsx
    │   └── Header.tsx
    │
    ├── layout.tsx                  # 2. 根布局：包裹所有页面
    ├── page.tsx                    # 3. 根页面：对应 URL "/"
    │
    ├── (marketing)/                # 4. 路由组：组织市场营销相关页面，不影响 URL
    │   ├── layout.tsx              #    - 此组的专属布局
    │   ├── about/
    │   │   └── page.tsx            #    - URL: /about
    │   └── contact/
    │       └── page.tsx            #    - URL: /contact
    │
    ├── dashboard/                  # 5. 静态路由
    │   ├── @team/                  # 6. 并行路由 "team" 插槽
    │   │   └── page.tsx
    │   ├── @analytics/             # 7. 并行路由 "analytics" 插槽
    │   │   └── page.tsx
    │   │
    │   ├── layout.tsx              # 8. 仪表盘布局，会接收 team 和 analytics props
    │   ├── page.tsx                # 9. 仪表盘主页，URL: /dashboard
    │   ├── settings/
    │   │   └── page.tsx            #    - URL: /dashboard/settings
    │   └── default.tsx             # 10. 并行路由的默认后备 UI
    │
    ├── blog/
    │   ├── [slug]/                 # 11. 动态路由
    │   │   ├── page.tsx            #     - URL: /blog/hello-world, /blog/another-post
    │   │   └── loading.tsx         #     - 加载博客文章时的 UI
    │   └── page.tsx                # 12. 博客列表页，URL: /blog
    │
    └── api/                        # 13. API 路由
        └── posts/
            └── route.ts            #     - API 端点: /api/posts (可处理 GET, POST 等)
```
示例解析：
1. `**_components**`: 存放了整个应用可能用到的通用组件，但它不是路由。
2. `**app/layout.tsx**`: 根布局，包含 `<html>` 和 `<body>` 标签，所有页面都会被它包裹。
3. `**app/page.tsx**`: 网站的主页 (`/`)。
4. `**(marketing)**`: 这是一个路由组。`about` 和 `contact` 页面被组织在一起，它们可以共享 `(marketing)/layout.tsx` 这个布局，但 URL 中不会出现 `(marketing)`。
5. `**dashboard/**`: 一个标准的静态路由段。
6. & **7.** `**@team**` **和** `**@analytics**`: 并行路由的插槽。当用户访问 `/dashboard` 时，`dashboard/layout.tsx` 会同时渲染 `@team/page.tsx` 和 `@analytics/page.tsx` 的内容。
7. `**dashboard/layout.tsx**`: 这个布局文件会接收 `props.team` 和 `props.analytics`，分别对应两个插槽的内容。
8. `**dashboard/page.tsx**`: 仪表盘的默认主内容区。
9. `**default.tsx**`: 如果 Next.js 因为某些原因（如刷新页面）无法解析 `@team` 或 `@analytics` 的活跃状态，它会渲染这个文件作为后备。
10. `**blog/[slug]**`: 动态路由，`slug` 的值可以在 `page.tsx` 中通过 `params` 获取。
11. `**blog/page.tsx**`: 博客文章列表页。
12. `**api/posts/route.ts**`: 创建了一个 API 端点，可以通过 `fetch('/api/posts')` 来访问。
  
## 高级特性：私有文件夹、路由组
---
### 一、私有文件夹 (Private Folders) - `_` 前缀
### 核心概念
以单个下划线 `_` 开头的文件夹及其所有子文件夹和文件，都会被 Next.js 的路由系统完全忽略。这意味着它们**永远不会**成为 URL 的一部分。
### 为什么需要它？
在 App Router 中，一个核心理念是**文件共置 (Colocation)**，即把与某个路由相关的组件、样式、工具函数等文件放在该路由的文件夹内。
但问题来了：如果你在 `app/dashboard/` 文件夹里创建了一个名为 `components` 的文件夹来存放组件，那么 `.../dashboard/components` 理论上可能会成为一个路由段。虽然它因为没有 `page.js` 而不会成为可访问页面，但这在语义上是不清晰的。
私有文件夹解决了这个问题。通过将其命名为 `_components`，你明确地告诉 Next.js：“这是一个纯粹用于代码组织的文件夹，不要把它当作路由的一部分。”
### 使用场景与示例
假设你正在构建一个仪表盘页面，需要一些只有仪表盘才会用到的特定组件。
**目录结构:**
```Plain
app/
└── dashboard/
    ├── _components/         # ✅ 私有文件夹，不会被路由
    │   ├── Chart.tsx
    │   └── StatCard.tsx
    │
    ├── _hooks/              # ✅ 存放仅供 dashboard 使用的 hooks
    │   └── useAnalytics.ts
    │
    ├── layout.tsx
    └── page.tsx             # 仪表盘页面，对应 /dashboard
```
**在** `**page.tsx**` **中使用:**
```TypeScript
// app/dashboard/page.tsx
import Chart from './_components/Chart';      // 从私有文件夹导入
import StatCard from './_components/StatCard';
import useAnalytics from './_hooks/useAnalytics';
export default function DashboardPage() {
  const data = useAnalytics();
  return (
    <div>
      <h1>My Dashboard</h1>
      <StatCard title="Users" value="1,234" />
      <Chart data={data} />
    </div>
  );
}
```
**要点:**
- **清晰的意图**: `_` 前缀清楚地表明这个文件夹不参与路由。
- **代码内聚**: 你可以把逻辑上属于 `dashboard` 的所有东西都放在 `app/dashboard/` 内，而不用担心会意外创建路由。
- **访问**: 访问 `/dashboard/_components/Chart` 会返回 404 Not Found。
---
### 二、路由组 (Route Groups) - `()` 包裹
### 核心概念
用括号 `()` 包裹的文件夹名称在构建 URL 时会被**完全忽略**。它仅仅作为一个组织工具，让你能够将不同的路由段分组，而不会在 URL 中添加额外的路径。
### 为什么需要它？
路由组主要解决两个问题：
1. **项目组织**: 当应用变大时，`app` 目录可能会变得杂乱。你可以使用路由组来划分不同的应用部分，例如 `(marketing)` 用于公共页面，`(app)` 用于需要登录的应用核心功能，`(auth)` 用于登录/注册流程。
2. **为不同路由组应用不同布局**: 这是路由组最强大的功能。你可以为每个组创建自己的顶层 `layout.tsx` 文件。例如，市场营销页面可能有一个公共的页头和页脚，而应用核心页面则有一个侧边栏和用户导航栏。
### 使用场景与示例
假设你的网站有两大部分：公共的市场营销页面（关于我们、价格）和需要登录的应用内部页面（仪表盘、设置）。这两部分需要完全不同的布局。
**目录结构:**
```Plain
app/
├── (marketing)/                  # 市场营销组，不影响 URL
│   ├── about/
│   │   └── page.tsx              # URL: /about
│   ├── pricing/
│   │   └── page.tsx              # URL: /pricing
│   └── layout.tsx                # ❗️只应用于 (marketing) 组的布局
│
├── (app)/                        # 应用核心功能组，不影响 URL
│   ├── dashboard/
│   │   └── page.tsx              # URL: /dashboard
│   ├── settings/
│   │   └── page.tsx              # URL: /settings
│   └── layout.tsx                # ❗️只应用于 (app) 组的布局
│
└── layout.tsx                    # 根布局，会被两个组的布局所继承
```
`**app/(marketing)/layout.tsx**` **可能的样子:**
```TypeScript
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
export default function MarketingLayout({ children }) {
  return (
    <>
      <PublicHeader />
      <main>{children}</main>
      <PublicFooter />
    </>
  );
}
```
`**app/(app)/layout.tsx**` **可能的样子:**
```TypeScript
import Sidebar from '@/components/Sidebar';
import UserNav from '@/components/UserNav';
export default function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main>
        <UserNav />
        {children}
      </main>
    </div>
  );
}
```
**要点:**
- **URL 不变**: `app/(marketing)/about/page.tsx` 的最终 URL 是 `/about`，而不是 `/(marketing)/about`。
- **布局隔离**: `(marketing)` 组下的所有页面共享 `MarketingLayout`，`(app)` 组下的所有页面共享 `AppLayout`。这比在单一的根布局中写复杂的条件判断要干净得多。
- **组织结构**: 让你的 `app` 目录结构能反映你的应用逻辑分区。
---
### 三、并行路由 (Parallel Routes) - `@` 前缀
### 核心概念
并行路由允许你在**同一个布局**中，同时渲染一个或多个独立的“页面”。这些独立的渲染槽（slot）使用 `@folder` 语法定义，并且它们像 props 一样被传递给父级 `layout.tsx`。
每个插槽（slot）都是一个完全独立的页面，拥有自己的 `loading.js` 和 `error.js` 状态。
### 为什么需要它？
对于高度动态的、复杂的仪表盘（Dashboard）或分屏视图非常有用。想象一个界面：
- 左侧是团队成员列表。
- 右侧是数据分析图表。
- 可能还会弹出一个登录模态框（Modal）。
在传统模式下，这三者都必须由同一个父组件管理状态。而使用并行路由，你可以将“团队列表”、“分析图表”和“模态框”都定义为独立的、可通过 URL 控制的路由。
### 使用场景与示例
我们来构建一个仪表盘，同时显示用户（`@users`）和收入（`@revenue`）信息。
**目录结构:**
```Plain
app/
└── dashboard/
    ├── @users/                 # "users" 插槽
    │   └── page.tsx
    │
    ├── @revenue/               # "revenue" 插槽
    │   └── page.tsx
    │
    ├── layout.tsx              # ❗️接收插槽作为 props
    └── page.tsx                # 主页面内容 (隐式的 children 插槽)
```
`**app/dashboard/layout.tsx**` **(关键部分):**
```TypeScript
// 布局文件会收到每个插槽作为 props
export default function DashboardLayout({ children, users, revenue }) {
  return (
    <>
      <h1>Dashboard</h1>
      {children} {/* 这是 dashboard/page.tsx 的内容 */}
      <div style={{ display: 'flex', marginTop: '20px' }}>
        <div style={{ flex: 1, marginRight: '10px' }}>
          <h2>Users</h2>
          {users} {/* 这是 @users/page.tsx 的内容 */}
        </div>
        <div style={{ flex: 1 }}>
          <h2>Revenue</h2>
          {revenue} {/* 这是 @revenue/page.tsx 的内容 */}
        </div>
      </div>
    </>
  );
}
```
**工作原理:**
- 当用户访问 `/dashboard` 时，Next.js 会同时渲染：
    1. `dashboard/page.tsx` -> 作为 `children` prop 传入布局。
    2. `dashboard/@users/page.tsx` -> 作为 `users` prop 传入布局。
    3. `dashboard/@revenue/page.tsx` -> 作为 `revenue` prop 传入布局。
- `DashboardLayout` 接收到这些渲染好的组件，并将它们放置在预定的位置。
### `default.js` 的作用
并行路由还有一个重要的配套文件：`default.js`。
**问题**: 如果你在 `/dashboard` 页面上，然后刷新浏览器，Next.js 知道要渲染 `@users` 和 `@revenue`。但如果你从其他页面导航到 `/dashboard`，Next.js 可能不知道应该在这些插槽里显示什么内容。同样，如果一个插槽的内容与当前 URL 不匹配，会发生什么？
**解决方案**: `default.js` 文件提供了一个后备（fallback）UI。当 Next.js 无法根据当前 URL 恢复某个插槽的活动状态时，它会渲染该插槽对应的 `default.js` 文件。
**示例:**
```Plain
app/
└── dashboard/
    └── @users/
        ├── default.tsx  # 当 @users 槽无法匹配时渲染这个
        └── page.tsx
```
**要点:**
- **解耦复杂UI**: 将一个复杂的界面分解成多个独立的、可独立加载和处理错误的小块。
- **状态在URL中**: 你甚至可以创建条件路由，比如让一个模态框成为一个并行路由 (`@modal`)，通过特定的 URL (`/dashboard?login=true`) 来显示它，使得UI状态可以被分享和收藏。
- **健壮性**: 配合 `default.js`，即使在复杂的导航场景下也能保证 UI 的一致性和完整性，避免整个页面因为一个插槽不匹配而崩溃。
---
