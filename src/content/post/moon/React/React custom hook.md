---
title: React Custom Hook
description: 定义与动机：以 use 开头的函数用于复用有状态逻辑；示例 useToggle 与 useFetch（含 AbortController 取消）；并总结命名、顶层调用、职责单一与返回形态等最佳实践。
publishDate: 2025-07-21
tags:
  - React
draft: false
---
### 一、React 自定义 Hook 是什么？
**核心定义：**
React 自定义 Hook 是一个**以** `**use**` **开头的 JavaScript 函数**，其内部可以调用其他的 React Hooks (如 `useState`, `useEffect`, `useContext` 等)。
**它的主要目的：**
是为了**提取和复用组件之间的状态逻辑 (Stateful Logic)**。
在 Hook 出现之前，我们通常使用“高阶组件 (HOC)”或“渲染属性 (Render Props)”这两种模式来复用逻辑，但这两种模式都存在一些问题，比如会产生额外的组件层级（“包装地狱”，Wrapper Hell），使得代码的可读性和维护性变差。
自定义 Hook 的出现，完美地解决了这个问题。它允许你在不增加组件层级的情况下，将组件逻辑提取出来，像一个普通函数一样在不同组件中调用，从而实现逻辑的优雅复用。
**总结一下自定义 Hook 的特点：**
1. **它是一个函数**：本质上就是一个普通的 JavaScript 函数。
2. **命名必须以** `**use**` **开头**：例如 `useFetch`, `useLocalStorage`。这是 React 的约定，React Linter 会根据这个约定来检查你是否违反了 Hook 的规则（例如，是否在顶层调用 Hook）。
3. **可以在内部调用其他 Hook**：这是自定义 Hook 强大功能的来源。它能将 `useState`, `useEffect` 等组合起来，封装成一段特定的逻辑。
4. **在组件间共享的是逻辑，而不是 state**：这一点非常重要。每次你在一个组件中使用自定义 Hook，它内部的 `useState` 和 `useEffect` 都是独立、不共享的。它帮你复用的是“如何管理状态”的这段代码，而不是状态本身。
---
### 二、为什么要使用自定义 Hook？
1. **逻辑复用 (Reusability)**：这是最主要的原因。比如，你可能需要在多个组件中从同一个 API 获取数据，并处理加载中、成功、失败这三种状态。你可以把这整套逻辑封装成一个 `useFetch` Hook，在任何需要它的地方调用即可。
2. **代码解耦与关注点分离 (Decoupling & Separation of Concerns)**：可以将复杂的业务逻辑从 UI 组件中抽离出来。这使得你的组件代码更简洁，只专注于渲染 UI，而逻辑部分则由 Hook 管理。这极大地提高了代码的可读性和可维护性。
3. **告别“包装地狱” (No Wrapper Hell)**：相比 HOC 和 Render Props，自定义 Hook 不会引入额外的组件嵌套，你的组件树会非常扁平、清晰。
4. **更好的可测试性 (Testability)**：因为自定义 Hook 是一个独立的函数，所以你可以单独对它进行单元测试，而无需渲染整个组件。
---
### 三、如何创建和使用自定义 Hook？
让我们通过几个从简单到复杂的例子来学习。
### 示例 1：一个简单的 `useToggle` Hook
**场景**：在很多组件中，我们都需要一个可以切换布尔值的状态（比如控制模态框的显示/隐藏）。
**1. 创建自定义 Hook (**`**useToggle.js**`**)**
```JavaScript
import { useState, useCallback } from 'react';
// 自定义 Hook 是一个以 'use' 开头的函数
function useToggle(initialState = false) {
  // 内部可以使用其他 React Hook，比如 useState
  const [state, setState] = useState(initialState);
  // 封装一个切换状态的函数
  // 使用 useCallback 是一个好习惯，可以避免不必要的函数重创建
  const toggle = useCallback(() => {
    setState(prevState => !prevState);
  }, []);
  // 返回组件需要的值和方法，通常使用数组或对象
  return [state, toggle];
}
export default useToggle;
```
**2. 在组件中使用它 (**`**MyComponent.jsx**`**)**
```JavaScript
import React from 'react';
import useToggle from './useToggle'; // 导入自定义 Hook
function MyComponent() {
  // 像使用 useState 一样调用自定义 Hook
  const [isModalOpen, toggleModal] = useToggle(false);
  return (
    <div>
      <button onClick={toggleModal}>
        {isModalOpen ? '关闭模态框' : '打开模态框'}
      </button>
      {isModalOpen && (
        <div className="modal">
          <h2>这是一个模态框</h2>
          <p>点击按钮可以关闭它。</p>
        </div>
      )}
    </div>
  );
}
export default MyComponent;
```
在这个例子中，`useToggle` 封装了管理布尔值状态的逻辑。任何组件只需要调用 `useToggle()` 就能获得这个功能，而无需在组件内部重复编写 `useState` 和 `setState(prev => !prev)` 的代码。
---
### 示例 2：一个更实用的 `useFetch` Hook
**场景**：在应用中，从 API 获取数据是一个非常常见的操作。我们需要处理加载中（loading）、数据（data）和错误（error）这三种状态。
**1. 创建自定义 Hook (**`**useFetch.js**`**)**
```JavaScript
import { useState, useEffect } from 'react';
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    // 使用 AbortController 来处理组件卸载时取消请求的情况
    const controller = new AbortController();
    const signal = controller.signal;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(url, { signal });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        // 如果是 AbortError，则不更新 state
        if (err.name !== 'AbortError') {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // useEffect 的清理函数
    // 当组件卸载或 url 变化时，会执行此函数
    return () => {
      controller.abort();
    };
  }, [url]); // 依赖项是 url，当 url 变化时，重新获取数据
  // 以对象形式返回，这样使用者可以按需解构，并且名字更清晰
  return { data, loading, error };
}
export default useFetch;
```
**2. 在组件中使用它 (**`**UserProfile.jsx**`**)**
```JavaScript
import React from 'react';
import useFetch from './useFetch';
function UserProfile({ userId }) {
  const { data: user, loading, error } = useFetch(
    `https://jsonplaceholder.typicode.com/users/${userId}`
  );
  if (loading) {
    return <div>正在加载用户数据...</div>;
  }
  if (error) {
    return <div>加载失败：{error.message}</div>;
  }
  return (
    <div>
      {user ? (
        <>
          <h1>{user.name}</h1>
          <p>Email: {user.email}</p>
          <p>Phone: {user.phone}</p>
        </>
      ) : (
        '未找到用户'
      )}
    </div>
  );
}
export default UserProfile;
```
通过 `useFetch`，我们的 `UserProfile` 组件变得非常干净。它只关心如何展示数据，而所有关于“如何获取数据、如何处理加载和错误状态”的复杂逻辑都被封装在了 `useFetch` Hook 内部。
---
### 四、自定义 Hook 的规则和最佳实践
1. **只在 React 函数组件的顶层或另一个自定义 Hook 中调用 Hook**。不要在循环、条件或嵌套函数中调用 Hook。
2. `**use**` **前缀是强制的**。这是 React Linter 识别 Hook 并检查规则的关键。
3. **保持 Hook 的单一职责**。一个好的 Hook 应该只做一件事，并把它做好。例如，`useFetch` 负责数据获取，`useLocalStorage` 负责与浏览器本地存储同步。
4. **自定义 Hook 不应返回 JSX**。它的职责是提供逻辑，而不是 UI。渲染是组件的工作。
5. **考虑返回值的形式**。
    - **返回数组** (如 `[value, setValue]`)：当返回的值数量少且有明确的顺序时（类似 `useState`），使用数组很方便，可以自由命名。
    - **返回对象** (如 `{ data, loading, error }`)：当返回的值数量多，或者未来可能扩展时，使用对象更好。使用者可以通过解构获取所需的值，代码可读性更高。
### 总结
自定义 Hook 是现代 React 开发中一个极其强大和基础的工具。它通过将状态逻辑从组件中抽离，实现了**逻辑复用**、**代码解耦**和**可维护性提升**，是编写高质量、可扩展 React 应用的基石。当你发现自己在多个组件中编写相似的 `useState` 和 `useEffect` 逻辑时，就应该考虑将它提取成一个自定义 Hook。
---
