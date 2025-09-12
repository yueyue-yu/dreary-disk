---
title: "useEffect 中的竞态条件"
description: "解析 useEffect 中异步请求的竞态根因与典型场景，并给出清理函数、AbortController 与自定义 Hook 等方案，确保仅最新一次副作用结果更新状态。"
publishDate: "2025-09-12"
tags: ["React", "useEffect", "竞态", "异步", "AbortController", "Hooks"]
draft: false
---

好的，我们从发生原因、背景、以及多种解决方案等角度，全面且深入地探讨 React `useEffect` 中的竞态条件（Race Condition）。

---

### 一、背景：为什么 `useEffect` 会涉及竞态条件？

在 React 函数式组件中，`useEffect` 是处理**副作用（Side Effects）** 的主要工具。副作用是指组件渲染（render）之外的任何操作，例如：

*   数据获取（API 请求）
*   设置订阅（Subscriptions）
*   手动更改 DOM

其中，**异步操作**，尤其是数据获取，是竞态条件最常见的温床。

`useEffect` 的执行时机与组件的生命周期紧密相关。当组件挂载（mount）或其依赖项（dependency array）发生变化时，`useEffect` 内部的函数就会执行。如果用户操作非常快，导致组件频繁地重新渲染和 `useEffect` 的重复执行，就可能引发问题。

### 二、发生原因：竞态条件是如何产生的？

竞态条件的核心原因是：**异步操作的完成顺序与它们的触发顺序不一致。**

我们用一个最经典的例子来说明：**一个根据用户输入实时搜索的搜索框**。

#### 场景分解：

1.  **用户输入 "a"**:
    *   组件状态 `query` 变为 `"a"`，组件重新渲染。
    *   `useEffect` 检测到 `query` 变化，执行并发出一个 API 请求：`fetch('/api?q=a')`。我们称之为 **请求A**。

2.  **用户快速输入 "b" (在请求A返回前)**:
    *   现在输入框内容是 "ab"。
    *   组件状态 `query` 变为 `"ab"`，组件再次重新渲染。
    *   `useEffect` 检测到 `query` 再次变化，执行并发出第二个 API 请求：`fetch('/api?q=ab')`。我们称之为 **请求B**。

#### 竞态发生：

现在，我们有两个并行的网络请求在途。由于网络延迟的不确定性，可能会发生以下情况：

*   **理想情况**：请求A先返回，然后请求B返回。UI 先显示 "a" 的结果，然后更新为 "ab" 的结果。最终正确。
*   **问题情况（竞态条件）**：服务器处理请求B（查询 "ab"）的速度非常快，它先返回了结果。
    1.  请求B完成，组件状态 `data` 被更新为 "ab" 的搜索结果。UI 正确显示了 "ab" 的结果。
    2.  过了一会儿，请求A（查询 "a"）这个“慢悠悠”的请求终于返回了。
    3.  代码执行了请求A的回调，将组件状态 `data` 更新为 "a" 的搜索结果。

**最终结果：** 用户的输入框里是 "ab"，但页面上显示的却是 "a" 的搜索结果。UI 状态和应用状态不一致，出现了 Bug。这就是典型的竞态条件：**一个过时的（stale）异步操作结果覆盖了一个较新的结果**。

#### 问题代码示例：

```jsx
import React, { useState, useEffect } from 'react';

function SearchComponent() {
  const [query, setQuery] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query === '') {
      setData([]);
      return;
    }

    setLoading(true);
    fetch(`https://api.example.com/search?q=${query}`)
      .then(res => res.json())
      .then(result => {
        // !!! 这里就是问题所在 !!!
        // 无论这个请求是何时发出的，只要它返回了，就会更新状态
        setData(result);
        setLoading(false);
      });
  }, [query]); // 依赖项是 query

  return (
    <div>
      <input 
        type="text" 
        value={query} 
        onChange={e => setQuery(e.target.value)} 
      />
      {/* ... 渲染 data ... */}
    </div>
  );
}
```

### 三、解决方案

解决竞态条件的核心思想是：**确保只有最后一次触发的异步操作才能更新组件状态，并忽略之前所有未完成的操作结果。**

React 提供了内置的机制来优雅地处理这个问题。

---

#### 解决方案 1：使用 `useEffect` 的清理函数（Cleanup Function）

这是最常用、最符合 React 设计哲学的解决方案。`useEffect` 可以返回一个函数，这个函数被称为“清理函数”。它会在以下两个时机执行：
1.  组件卸载（unmount）时。
2.  在下一次 `useEffect` 即将执行**之前**。

我们可以利用第二点来“取消”上一次的副作用。

**实现方式：**

```jsx
useEffect(() => {
  let isCancelled = false; // 定义一个布尔标记

  if (query) {
    setLoading(true);
    fetch(`https://api.example.com/search?q=${query}`)
      .then(res => res.json())
      .then(result => {
        // 在更新状态前，检查该次 effect 是否已被“取消”
        if (!isCancelled) {
          setData(result);
          setLoading(false);
        }
      });
  }

  // 清理函数
  return () => {
    isCancelled = true;
  };
}, [query]);
```

**工作流程解析：**

1.  **输入 "a"**: `useEffect` 执行。`isCancelled` (在闭包A中) 为 `false`。请求A发出。
2.  **输入 "b"**:
    *   React 准备执行新的 `useEffect` (因为 `query` 变了)。
    *   在执行新 effect **之前**，它会先调用上一次 effect 的**清理函数**。
    *   闭包A中的 `isCancelled` 被设置为 `true`。
    *   新的 `useEffect` 开始执行，它有自己的一个新的 `isCancelled` (在闭包B中) 为 `false`。请求B发出。
3.  **请求B返回**: 此时闭包B中的 `isCancelled` 是 `false`，`setData` 被调用，UI 更新为 "ab" 的结果。
4.  **请求A返回**: 此时闭包A中的 `isCancelled` 已经被设为 `true`，`if (!isCancelled)` 条件不满足，`setData` 不会被调用。过时的状态更新被成功忽略。

---

#### 解决方案 2：使用 `AbortController` (更现代、更强大的方法)

对于 `fetch` API，浏览器提供了 `AbortController` 接口，它不仅可以忽略旧请求的结果，还能**真正地中止网络请求**，节省用户的带宽和服务器的资源。

**实现方式：**

```jsx
useEffect(() => {
  // 每次 effect 运行时都创建一个新的 AbortController
  const controller = new AbortController();

  if (query) {
    setLoading(true);
    fetch(`https://api.example.com/search?q=${query}`, { 
      signal: controller.signal // 将 signal 传递给 fetch
    })
      .then(res => res.json())
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(err => {
        // 当请求被中止时，fetch 会抛出一个 AbortError，我们需要捕获并忽略它
        if (err.name === 'AbortError') {
          console.log('Fetch aborted');
        } else {
          // 处理其他错误
          console.error(err);
        }
      });
  }

  // 清理函数
  return () => {
    // 在下一次 effect 执行或组件卸载时，中止上一次的请求
    controller.abort();
  };
}, [query]);
```

**优势：**

*   **资源节约**: 真正取消了不必要的网络请求。
*   **代码清晰**: 意图明确，是处理可中止异步任务的现代标准。

---

#### 解决方案 3：封装成自定义 Hook (最佳实践)

为了代码的复用性和可维护性，我们可以将上述逻辑封装到一个自定义 Hook 中，例如 `useDebouncedFetch` 或 `useCancellableFetch`。

**`useCancellableFetch` 示例：**

```jsx
import { useState, useEffect } from 'react';

function useDataFetcher(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;

    const controller = new AbortController();
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(url, { signal: controller.signal });
        const result = await response.json();
        setData(result);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [url]); // 依赖于 url

  return { data, loading, error };
}

// 在组件中使用
function SearchComponent() {
  const [query, setQuery] = useState('');
  const url = query ? `https://api.example.com/search?q=${query}` : null;
  const { data, loading, error } = useDataFetcher(url);

  return (
    <div>
      <input 
        type="text" 
        value={query} 
        onChange={e => setQuery(e.target.value)} 
      />
      {loading && <p>Loading...</p>}
      {error && <p>Error!</p>}
      {/* ... 渲染 data ... */}
    </div>
  );
}
```

这个自定义 Hook 完美地封装了竞态条件的处理逻辑，让组件代码变得极其简洁和声明式。

### 四、总结

| 方面 | 描述 |
| :--- | :--- |
| **背景** | `useEffect` 用于处理异步副作用，而组件的快速重渲染会频繁触发新的异步操作。 |
| **原因** | 异步操作的**完成顺序**与**触发顺序**不一致，导致旧的、过时的操作结果覆盖了新的状态。 |
| **核心问题** | 组件无法区分返回的数据是来自哪一次的 `useEffect` 调用。 |
| **解决方案1 (Cleanup Flag)** | 使用 `useEffect` 清理函数和一个布尔标记。在更新状态前检查标记，忽略被“取消”的 effect 的结果。**简单有效**。 |
| **解决方案2 (AbortController)** | 使用清理函数调用 `AbortController.abort()`。不仅能忽略结果，还能**真正中止网络请求**，是 fetch 的**首选方案**。 |
| **解决方案3 (Custom Hook)** | 将竞态条件处理逻辑**抽象和封装**到自定义 Hook 中，是实现代码**高复用性**和**可维护性**的**最佳实践**。 |

理解并正确处理 `useEffect` 中的竞态条件，是每一位 React 开发者编写健壮、无 bug 的应用程序的必备技能。
