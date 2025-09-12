---
type: Post
status: Published
date: 2025-08-04
category: 技术分享
---
**Hydration (通常翻译为“激活”或“水合”)** 是 SSR 流程中至关重要的一步。它就像是给服务器端渲染出的“静态骨架”注入“灵魂”的过程。
下面我们来详细拆解 Hydration 的全过程。
### 为什么需要 Hydration？
首先，回顾一下 SSR 的第一步：服务器返回了一个完整的 HTML 文件。浏览器收到后可以立刻渲染，用户能很快看到页面内容。
**但问题是：** 这个 HTML 是“死的”。它只是纯粹的 DOM 结构和文本。页面上的按钮点击没反应，路由链接也不会在客户端跳转，因为它背后的 JavaScript 事件监听和虚拟 DOM 还没有建立起来。
**Hydration 的目标就是：** 在不重新创建 DOM 的情况下，让客户端的 JavaScript (React, Vue 等) “接管”这些已经存在的 DOM 元素，并为它们附加交互能力，使之成为一个功能完整的单页应用 (SPA)。
---
### Hydration 的详细步骤
我们以一个简单的计数器应用为例，来走一遍完整的 Hydration 流程。
**假设我们的组件是这样的 (以 React 为例):**
```JavaScript
// Counter.jsx
import React, { useState } from 'react';
function Counter() {
  const [count, setCount] = useState(0); // 初始值为 0
  return (
    <div>
      <h1>Counter</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```
### **前提条件：服务器端渲染完成**
服务器已经执行了这段代码，并生成了如下的 HTML 和初始状态，然后发送给了浏览器。
```HTML
<!DOCTYPE html>
<html>
<head>
  <title>SSR App</title>
</head>
<body>
  <div id="root">
    <!-- ↓↓↓↓↓ 这是服务器渲染出的静态 HTML ↓↓↓↓↓ -->
    <div>
      <h1>Counter</h1>
      <p>Count: 0</p>
      <button>Increment</button>
    </div>
    <!-- ↑↑↑↑↑ 此时按钮点击无效 ↑↑↑↑↑ -->
  </div>
  <!-- ↓↓↓↓↓ 服务器将初始状态序列化后注入到 script 标签中 ↓↓↓↓↓ -->
  <script>
    window.__INITIAL_STATE__ = { "count": 0 };
  </script>
  <!-- ↓↓↓↓↓ 引用客户端运行的 JS 包 ↓↓↓↓↓ -->
  <script src="/static/js/bundle.js"></script>
</body>
</html>
```
现在，Hydration 过程正式开始。
---
### **第一步：浏览器加载与解析**
1. 浏览器接收到 HTML，立即解析并渲染 DOM。用户此时看到了一个标题为 "Counter"，内容为 "Count: 0" 的静态页面。
2. 浏览器继续解析，发现了 `<script src="/static/js/bundle.js">`，开始下载这个 JavaScript 文件。
### **第二步：客户端 JavaScript 执行**
1. `bundle.js` 下载并执行。这个 JS 文件包含了 React 框架本身以及我们写的 `Counter` 组件代码。
2. 客户端的 React 代码启动。它会寻找一个根节点来挂载应用（通常是 `div#root`）。
3. **关键区别：** 在纯客户端渲染 (CSR) 模式下，React 会调用 `ReactDOM.render()` 或 `createRoot().render()`，它会清空 `div#root` 里的所有内容，然后从零开始创建所有 DOM 元素。但在 SSR 模式下，我们调用的是 `**ReactDOM.hydrateRoot()**` (在新版 React 中) 或 `ReactDOM.hydrate()` (在旧版中)。
### **第三步：内存中重建虚拟 DOM**
1. `hydrateRoot()` 函数被调用后，React 不会立即操作真实 DOM。
2. 它会读取 `window.__INITIAL_STATE__` 来获取初始数据（在这个例子里，它知道 `count` 的初始值是 `0`）。
3. 然后，React 在**内存中**运行 `Counter` 组件的代码，根据初始数据 `count: 0`，创建一个**虚拟 DOM (Virtual DOM)** 树。
这个内存中的虚拟 DOM 树看起来会是这样（简化表示）：
```JSON
{
  "type": "div",
  "props": {
    "children": [
      { "type": "h1", "props": { "children": "Counter" } },
      { "type": "p", "props": { "children": "Count: 0" } },
      {
        "type": "button",
        "props": {
          "onClick": "function() { ... }", // 注意：这里有事件处理器
          "children": "Increment"
        }
      }
    ]
  }
}
```
### **第四步：比对与附加（The "Hydration" Magic）**
这是 Hydration 最核心的步骤。
1. React 会拿着内存中新创建的虚拟 DOM 树，从根节点 (`div#root` 的第一个子节点) 开始，与浏览器中已经存在的真实 DOM 树进行**逐一比对**。
2. 它会像这样进行检查：
    - 虚拟 DOM 的第一个节点是 `div`，真实 DOM 的第一个节点也是 `div`。**匹配！**
    - 进入 `div` 内部。虚拟 DOM 的第一个子节点是 `h1`，真实 DOM 也是 `h1`。**匹配！**
    - 虚拟 DOM 的第二个子节点是 `p`，真实 DOM 也是 `p`，文本内容也都是 "Count: 0"。**匹配！**
    - 虚拟 DOM 的第三个子节点是 `button`，真实 DOM 也是 `button`。**匹配！**
3. 在比对的过程中，React 发现这些 DOM 节点都已存在，所以它**不会重新创建它们**。这是 Hydration 性能优化的关键！
4. 它只会做一件事：将虚拟 DOM 中定义的**事件监听器 (如** `**onClick**`**)** 和其他属性，**附加 (attach)** 到已经存在的真实 DOM 节点上。
**过程完成后，**`**button**` **元素现在就有了** `**onClick**` **事件的句柄了。**
### **第五步：接管应用**
1. 一旦 Hydration 过程顺利完成，React 就完全“接管”了整个应用的控制权。
2. 现在，这个应用已经从一个静态页面，变成了一个**完全可交互的单页应用**。
3. 当用户点击 "Increment" 按钮时：
    - 附加的 `onClick` 事件被触发。
    - `setCount(1)` 被调用，组件状态更新。
    - React 会生成一个新的虚拟 DOM (`<p>Count: 1</p>`)，与旧的虚拟 DOM 比对，只更新发生变化的 `p` 标签，而不再需要服务器的参与。
---
### Hydration 失败的情况（Mismatch）
如果服务器端渲染出的 HTML 和客户端首次渲染生成的虚拟 DOM **不匹配**，就会发生 Hydration Mismatch。
**常见原因：**
- 在代码中使用了仅存在于客户端的 API，如 `window.innerWidth`。
- 渲染了随机数 (`Math.random()`) 或当前时间 (`new Date()`)。
- 服务器和客户端的数据获取逻辑不一致。
**后果：**
当 React/Vue 检测到不匹配时，为了保证应用的一致性和正确性，它会放弃 Hydration 优化。它会**丢弃所有服务器端渲染的 DOM，然后执行一次完整的客户端渲染**，从头开始创建所有 DOM 节点。
这会导致：
- **性能下降：** 浪费了服务器渲染的成果，客户端需要做双倍的工作。
- **页面闪烁：** 用户可能会看到页面内容有一次明显的闪烁（从服务器版本切换到客户端版本）。
- **控制台警告：** 框架会在开发者控制台打印出详细的警告信息，帮助你定位问题。
### 总结
**Hydration** 可以看作是一个高效的“交接仪式”：
- **输入：** 服务器生成的静态 HTML + 初始数据。
- **过程：** 客户端 JS 框架在内存中重建组件的虚拟 DOM，然后与真实 DOM 进行比对，不创建新节点，只附加事件监听器。
- **输出：** 一个完全由客户端 JS 控制的、可交互的单页应用。
- **核心价值：** 复用服务器渲染的成果，避免了客户端的重复渲染工作，实现了从静态内容到动态应用平滑、高效的过渡。