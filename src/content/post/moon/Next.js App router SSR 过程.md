title: "Next.js App Router SSR 过程"
description: "解析 App Router 下客户端组件与服务端组件的渲染与水合流程：客户端组件的预渲染与激活、服务端组件的 RSC Payload 与流式传输，并对比传统 SSR。"
publishDate: "2025-09-12"
tags: ["Next.js", "SSR", "App Router", "RSC", "Hydration"]
draft: false
type: Post
status: Published
date: 2025-08-04
category: 技术分享
---

# **客户端组件（Client Component）**
这是一个关于在 Next.js App Router (或 React Server Components) 中 `"use client"` 组件 SSR 过程的详细解释。
很多人会有一个误解：既然是 `"use client"`，那它肯定完全不参与服务端渲染（SSR）。**这是不正确的**。
`"use client"` 组件**会**在服务端进行预渲染（Pre-rendering），生成静态的 HTML。它的“客户端”特性体现在它的交互逻辑和生命周期钩子（如 `useEffect`, `useState`）只在客户端执行和“激活”。
下面我们来分解这个过程，从一个请求开始到页面完全可交互。
---
### 核心概念：`"use client"` 的真正含义
首先，要理解 `"use client"` 并不是“只在客户端运行”的指令。它是一个**边界声明**。
它告诉打包工具和 React：

> “从这个文件开始，以及它所导入的所有其他模块（如果那些模块没有被标记为 "use server"），都属于客户端组件树。请把它们的 JavaScript 代码打包并发送到浏览器。”
与之相对的是默认的**服务端组件 (Server Components)**，它们的 JS 代码永远不会被发送到浏览器。
### SSR 详细步骤
假设我们有这样一个组件结构：
```JavaScript
// app/page.tsx (Server Component - 默认)
import MyClientComponent from './MyClientComponent';
export default function Page() {
  console.log('Rendering on the Server: Page Component');
  return (
    <div>
      <h1>Welcome to my App</h1>
      <MyClientComponent serverProp="Hello from Server!">
        <p>A child from a Server Component</p>
      </MyClientComponent>
    </div>
  );
}
// app/MyClientComponent.tsx
"use client";
import { useState, useEffect } from 'react';
export default function MyClientComponent({ serverProp, children }) {
  const [count, setCount] = useState(0);
  const [data, setData] = useState(null);
  console.log('Rendering MyClientComponent...'); // 这行日志会打印两次！一次在服务端，一次在客户端
  useEffect(() => {
    // 这个钩子只在客户端运行
    console.log('Effect is running on the Client!');
    // 假设我们在这里通过API获取数据
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []); // 空依赖数组，只在挂载后运行一次
  return (
    <div className="client-box">
      <h2>I am a Client Component</h2>
      <p>Prop from server: {serverProp}</p>
      <div>{children}</div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
      <p>Data from client-side fetch: {data ? data.message : 'Loading...'}</p>
    </div>
  );
}
```
现在，让我们跟随一个用户的浏览器请求，看看发生了什么。
### 第 1 步：服务端 - RSC 渲染与 HTML 生成
当一个请求到达 Next.js 服务器时：
1. **服务端组件执行**：
    - React 开始在服务端渲染 `app/page.tsx`。
    - `console.log('Rendering on the Server: Page Component')` 会在你的服务器终端打印出来。
    - 当 React 遇到 `<MyClientComponent>` 时，它识别出这是一个客户端组件（因为文件顶部的 `"use client"`）。
2. **客户端组件的“快照”渲染**：
    - 服务器**并不会**跳过这个组件。相反，它会**执行这个组件函数体本身**，为其生成一个初始的、非交互式的 HTML。
    - `console.log('Rendering MyClientComponent...')` **会在服务器终端打印**。
    - `useState(0)` 被调用，`count` 的初始值 `0` 被用于渲染。
    - `onClick` 事件处理器被忽略，因为它在服务端没有意义。
    - `**useEffect**` **钩子完全被跳过**。这是关键！所有生命周期和交互逻辑都不会在服务端运行。
    - 因此，`data` 的值将是 `null`，HTML 中会显示 "Loading..."。
3. **生成最终 HTML**：
    - 服务器将整个组件树（包括 `MyClientComponent` 的初始 HTML）序列化为一个完整的 HTML 字符串。
    - 最终发送给浏览器的 HTML 文件会是这样的（简化后）：
        
        ```HTML
        <div>
          <h1>Welcome to my App</h1>
          <div class="client-box">
            <h2>I am a Client Component</h2>
            <p>Prop from server: Hello from Server!</p>
            <div><p>A child from a Server Component</p></div>
            <p>Count: 0</p>
            <button>Increment</button> <!-- 注意：没有 onclick 处理器 -->
            <p>Data from client-side fetch: Loading...</p>
          </div>
        </div>
        ```
        
    - 这个 HTML 是静态的，但对 SEO 非常友好，并且能让用户非常快地看到内容（First Contentful Paint）。
### 第 2 步：客户端 - 水合 (Hydration)
浏览器收到了 HTML，并开始下载相应的 JavaScript 文件（包括 `MyClientComponent` 的代码）。
1. **显示静态 HTML**：浏览器立即渲染收到的 HTML。用户看到了页面，但按钮还不能点击。
2. **JavaScript 执行**：JS 文件加载完毕并开始执行。
3. **水合过程**：
    - React 开始在客户端“接管”服务端渲染的 HTML。这个过程称为**水合**。
    - React 会在客户端重新运行组件代码，以构建虚拟 DOM。
    - `console.log('Rendering MyClientComponent...')` **会在浏览器控制台再次打印**。
    - `useState(0)` 再次被调用，但 React 很聪明，它会看到 DOM 中已经有了一个值为 `0` 的 `p` 标签，所以它会保留这个状态，而不是重置。
    - React 会将 `onClick` 事件处理器**附加**到现有的 `<button>` DOM 元素上。
    - 现在，这个组件的静态 HTML 已经被“激活”了。
### 第 3 步：客户端 - 交互与副作用
水合完成后，组件就完全进入了客户端生命周期。
1. `**useEffect**` **执行**：
    - 此时，`useEffect` 钩子被触发。
    - `console.log('Effect is running on the Client!')` 会在浏览器控制台打印。
    - `fetch` 请求被发送出去。
    - 当数据返回后，`setData` 被调用，组件重新渲染，"Loading..." 被替换为实际数据。
2. **用户交互**：
    - 用户点击 "Increment" 按钮。
    - `onClick` 事件触发，调用 `setCount`。
    - `count` 状态更新，组件重新渲染，页面上显示的数字变为 `1`。
---
### 总结与对比
|阶段|服务端 (SSR)|客户端 (Hydration & Interactivity)|
|---|---|---|
|**组件渲染**|✅ **会渲染**，生成初始 HTML|✅ **会再次渲染**，用于水合和后续更新|
|`**useState**`|✅ **使用初始值** (`useState(0)`) 来生成 HTML|✅ **初始化状态**，并使其能够通过 `set` 函数更新|
|`**useEffect**`|❌ **完全不运行**|✅ **在水合后运行**|
|**事件处理器 (**`**onClick**`**)**|❌ **不附加**到 HTML|✅ **在水合时附加**到 DOM 元素|
|**浏览器 API (**`**window**`**)**|❌ **不可用**（直接使用会报错）|✅ **可用**（通常在 `useEffect` 中使用）|
  
# **服务端组件 (Server Component)**
组件**不使用** `"use client"`，意味着它是一个**服务端组件 (Server Component)**。这是 App Router 中的**默认**组件类型。
其 SSR 过程与传统的 SSR 和 `"use client"` 组件的 SSR 有着根本性的不同。它不是生成可水合的 HTML，而是生成一种特殊的 UI 描述格式，我们称之为 **RSC Payload**。
---
### 服务端组件 (Server Component) 的核心特性
在深入过程之前，先理解它的本质：
1. **只在服务端运行**：它的代码、逻辑、依赖项**永远不会**被打包发送到浏览器。
2. **无状态、无生命周期**：不能使用 `useState`, `useEffect`, `useContext` 等客户端钩子。
3. **无交互**：不能使用 `onClick`, `onChange` 等事件处理器。
4. **可以直接访问后端资源**：可以 `async/await`，直接查询数据库、访问文件系统、使用只有服务端才有的环境变量或 SDK。
---
### 服务端组件的 SSR 详细步骤
让我们以一个典型的场景为例：一个页面需要从数据库获取文章列表并显示。
```JavaScript
// app/posts/page.tsx (这是一个服务端组件，因为没有 "use client")
import db from '@/lib/db'; // 假设这是一个数据库连接模块
import Link from 'next/link';
// 导入一个客户端组件用于点赞
import LikeButton from './LikeButton';
// 注意组件函数是 async 的！
export default async function PostsPage() {
  console.log('Rendering on the Server: PostsPage Component');
  // 1. 直接在组件中进行数据获取
  const posts = await db.post.findMany();
  return (
    <div>
      <h1>All Posts</h1>
      <ul>
        {posts.map(post => (
          <li key={post.id}>
            <Link href={`/posts/${post.slug}`}>
              {post.title}
            </Link>
            {/* 渲染一个客户端组件，并传入服务端获取的数据 */}
            <LikeButton initialLikes={post.likes} postId={post.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
// app/posts/LikeButton.tsx
"use client";
import { useState } from 'react';
export default function LikeButton({ initialLikes, postId }) {
  const [likes, setLikes] = useState(initialLikes);
  // ... (处理点击事件的逻辑)
  return <button onClick={() => setLikes(l => l + 1)}>{likes} Likes</button>;
}
```
现在，我们来跟踪一个请求的完整流程。
### 第一步：服务端渲染 (生成指令与骨架)
当一个请求到达 Next.js 服务器时：
1. **执行服务端组件并获取数据**:
    - React 在服务端运行 `PostsPage` 组件。由于它是 `async` 的，React 会等待 `await db.post.findMany()` 完成，直接在组件内部高效地获取数据。
2. **生成 UI 构建蓝图 (RSC Payload)**:
    - 组件执行完毕后，React **并不直接生成 HTML**。
    - 相反，它会生成一份详细的 **UI 构建蓝图 (RSC Payload)**。这份蓝图是一份紧凑的指令集，告诉浏览器如何精确地构建用户界面。
    - 这份蓝图包含：
        - **已完成的部分**: 服务端组件渲染出的最终结果，如 `<h1>`, `<li>` 等静态内容。
        - **待激活的标记**: 对于客户端组件 (`<LikeButton />`)，蓝图里只有一个**“占位标记”**。这个标记记录了三件事：
            1. 要使用哪个组件 (`LikeButton`)。
            2. 需要传递给它的 props (`initialLikes`, `postId`)。
            3. 它的初始外观（一个静态的 `<button>`）。
3. **流式发送骨架与蓝图**:
    - 基于这份蓝图，Next.js 会立即生成一个**静态的 HTML 骨架 (Shell)**。
    - 服务器以**流式 (Streaming)** 的方式，将 **HTML 骨架** 和 **RSC 蓝图** 一起发送给浏览器。这意味着浏览器可以先接收并渲染骨架，无需等待整个蓝图加载完毕，从而实现极速的首次内容展示。
### 第二步：客户端构建 (拼接与激活)
浏览器接收到来自服务器的数据流后，开始组装最终的交互式页面：
1. **立即渲染骨架**:
    - 浏览器首先渲染收到的静态 HTML 骨架。用户几乎瞬间就能看到页面的布局和内容，但此时页面还是静态的。
2. **解析蓝图并“拼接”UI**:
    - 客户端的 React 运行时开始读取 RSC 蓝图。
    - 关键在于，它**不会重新执行** `**PostsPage**` **的代码**（因为这些代码根本没被送到浏览器）。
    - React 像拼图一样，直接将蓝图中**“已完成的部分”**（服务端组件的结果）无缝“拼接”到 DOM 中。这个过程比传统的水合（Hydration）更高效，因为它完全信任服务端的结果。
3. **“激活”客户端组件**:
    - 当 React 在蓝图中遇到客户端组件的**“占位标记”**时，它知道这块区域需要被“激活”。
    - 它会：
        - 按需加载 `LikeButton` 组件的 JavaScript 代码。
        - 对这个**特定的**、**独立的**组件进行**水合 (Hydrate)**，即将客户端逻辑（如 `useState`, `onClick`）附加到服务端预渲染的 `<button>` DOM 元素上。
---
### 总结与对比
|特性|服务端组件 (无 `"use client"`)|客户端组件 (`"use client"`)|
|---|---|---|
|**运行环境**|**仅限服务端**|服务端 (预渲染) + 客户端 (水合与交互)|
|**JS 到浏览器**|❌ **否** (零 JS 体积)|✅ **是** (代码被打包发送)|
|**SSR 输出**|**RSC Payload** + 静态 HTML Shell|纯粹的**可水合 HTML**|
|**客户端过程**|**解析 Payload 并拼接 UI**|**水合 (Hydration)**|
|**数据获取**|`async/await`，直接访问后端|通常在 `useEffect` 或库中通过 `fetch`|
|**状态/生命周期**|❌ **不可用**|✅ **可用**|
|**交互性**|❌ **不可用**|✅ **可用**|
### 为什么这么设计？
服务端组件的 SSR 模式带来了巨大的性能和开发体验优势：
1. **极致的性能**：将大量组件逻辑（特别是数据获取和渲染逻辑）保留在服务器上，显著减少了发送到客户端的 JavaScript 包大小。
2. **更近的数据源**：组件可以直接在服务器上与数据源（数据库、微服务）通信，减少了网络延迟和客户端的请求瀑布。
3. **安全性**：敏感数据和逻辑（如 API 密钥、数据库凭证）永远不会泄露到客户端。
4. **自动代码分割**：你天然就不需要为服务端组件做任何代码分割，因为它们的代码本来就不会被发送。客户端组件则会自动按需加载。
简而言之，对于**不使用** `**"use client"**` **的服务端组件**，SSR 过程是一个**执行、序列化、并在客户端重构**的过程，而不是传统的**渲染、水合**过程。
  
  
# 传统SSR
好的，我们来详细对比一下传统的 SSR (Server-Side Rendering)，比如在 Next.js Pages Router 或其他框架（如 Nuxt 2, Express+React）中的实现方式。这能更好地凸显出 RSC 模式的革新之处。
---
### 传统 SSR 的核心理念
传统 SSR 的目标很简单：**在服务器上将整个 React 应用渲染成一个完整的 HTML 字符串，然后将其发送给浏览器，最后在浏览器端通过“水合 (Hydration)”过程，将这个静态的 HTML 变成一个可交互的单页应用 (SPA)。**
这个过程就像是打印一张照片（服务端生成 HTML），然后把这张照片贴在一个空白的画布上，再由画师（客户端 JS）照着照片的样子重新描摹一遍，并给它加上动态效果。
### 传统 SSR 的详细步骤
我们用一个类似但更符合传统 SSR 模式的例子来说明。
```JavaScript
// pages/posts.jsx (Next.js Pages Router 语法)
import { useState, useEffect } from 'react';
import LikeButton from '../components/LikeButton'; // 这是一个普通组件
export default function PostsPage({ posts }) {
  // `posts` 是通过 `getServerSideProps` 从服务端获取的
  console.log('Rendering PostsPage...'); // 会在服务端和客户端各打印一次
  return (
    <div>
      <h1>All Posts</h1>
      <ul>
        {posts.map(post => (
          <li key={post.id}>
            <a href={`/posts/${post.slug}`}>{post.title}</a>
            <LikeButton initialLikes={post.likes} />
          </li>
        ))}
      </ul>
    </div>
  );
}
// 这是一个普通的客户端组件
// components/LikeButton.jsx
export default function LikeButton({ initialLikes }) {
    const [likes, setLikes] = useState(initialLikes);
    return <button onClick={() => setLikes(l => l + 1)}>{likes} Likes</button>;
}

// 数据获取函数，只在服务端运行
export async function getServerSideProps(context) {
  const posts = await db.post.findMany(); // 在服务端查询数据库
  return {
    props: {
      posts, // 数据会作为 props 传递给 PostsPage 组件
    },
  };
}
```
现在，我们来跟踪一个请求的完整流程。
### 第 1 步：服务端 - 数据获取与 HTML 渲染
当一个请求到达 Next.js 服务器时：
1. **执行数据获取函数**:
    - Next.js 发现这个页面有 `getServerSideProps` 函数，于是**首先**在服务端执行它。
    - `await db.post.findMany()` 完成，获取到 `posts` 数据。
2. **将整个应用渲染为 HTML 字符串**:
    - Next.js 调用 React 的 `renderToString` (或类似) 方法。
    - 它将 `<PostsPage>` 组件以及它所有的子组件（包括 `<LikeButton>`）**全部在服务端执行一遍**。
    - `console.log('Rendering PostsPage...')` 会在服务器终端打印。
    - 在渲染 `<LikeButton>` 时，`useState(initialLikes)` 会被调用，并使用其初始值来生成 HTML。
    - **所有的事件处理器 (**`**onClick**`**) 和生命周期钩子 (**`**useEffect**`**) 都会被完全忽略**。
    - 最终，服务器生成一个完整的、包含所有内容的 HTML 字符串。
3. **打包 Props 并发送**:
    - 服务器将上一步生成的 **HTML 字符串** 发送给浏览器。
    - 同时，它会将 `getServerSideProps` 返回的 `props` 对象（也就是 `posts` 数据）**序列化为 JSON**，并嵌入到 HTML 的一个 `<script>` 标签中，通常是 `__NEXT_DATA__`。
**浏览器收到的初始 HTML 文件（简化后）：**
```HTML
<!DOCTYPE html>
<html>
<body>
  <div id="__next">
    <!-- 整个应用的完整静态 HTML -->
    <div>
      <h1>All Posts</h1>
      <ul>
        <li><a href="...">...</a><button>10 Likes</button></li>
        <li><a href="...">...</a><button>5 Likes</button></li>
      </ul>
    </div>
  </div>
  <!-- 序列化的 props 数据 -->
  <script id="__NEXT_DATA__" type="application/json">
    { "props": { "pageProps": { "posts": [{...}, {...}] } } }
  </script>
  <!-- 引用整个应用的 JS bundle -->
  <script src="/_next/static/chunks/app.js"></script>
  <script src="/_next/static/chunks/posts.js"></script>
</body>
</html>
```
### 第 2 步：客户端 - 水合 (Hydration)
浏览器接收到响应后：
1. **渲染静态 HTML**: 浏览器立即渲染收到的 HTML。用户看到一个完整的、但无法交互的页面。
2. **下载并执行 JS**: 浏览器开始下载 `<script>` 标签中引用的 JavaScript 文件。**关键在于，这些 JS 文件包含了整个页面所有组件（**`**PostsPage**`**,** `**LikeButton**` **等）的代码**。
3. **水合过程**:
    - JS 加载完毕后，React 开始在客户端**重新运行整个应用的组件代码**。
    - `console.log('Rendering PostsPage...')` 会在浏览器控制台**再次打印**。
    - React 会从 `__NEXT_DATA__` 中读取 `posts` 数据，并将其作为 props 传递给 `<PostsPage>`。
    - 它会在内存中构建一个完整的虚拟 DOM 树。
    - 然后，它会**逐个节点**地将这个虚拟 DOM 树与服务端渲染的静态 HTML 进行比对。
    - 如果匹配，它就**不会**重新创建 DOM 节点，而是**将事件处理器（如** `**onClick**`**）附加到现有的 HTML 元素上**。
水合完成后，整个页面就从静态 HTML 变成了可交互的 React 应用。
---
### 传统 SSR 与 RSC 模式的对比
|特性|传统 SSR|RSC 模式 (服务端组件)|
|---|---|---|
|**数据获取**|在组件外部的特定函数中 (`getServerSideProps`)|直接在组件内部 `async/await`|
|**JS Bundle**|**所有**页面组件的 JS 都被发送到浏览器|**只有**客户端组件 (`"use client"`) 的 JS 被发送|
|**服务端输出**|HTML + 序列化的 JSON 数据|HTML Shell + RSC Payload (UI 指令集)|
|**客户端过程**|**水合整个页面** (Hydration)|**拼接 UI** + **局部水合**客户端组件|
|**组件模型**|所有组件本质上都是“客户端组件”，只是在服务端预渲染|严格区分服务端组件和客户端组件|
|**性能瓶颈**|1. JS 包体积大，导致可交互时间 (TTI) 延迟。<br>2. 整个页面必须渲染完成才能发送。|1. JS 包体积小得多。<br>2. 支持流式渲染，FCP更快。|
**核心区别**: 传统 SSR 的终点是“水合整个应用”，而 RSC 模式的终点是“用蓝图拼接 UI 并激活交互孤岛”。后者避免了在客户端重新执行大量渲染逻辑，并从根本上减少了发送到浏览器的 JavaScript 代码量。
