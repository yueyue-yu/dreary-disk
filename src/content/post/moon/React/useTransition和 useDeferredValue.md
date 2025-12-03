---
title: useTransition和 useDeferredValue
description: ""
publishDate: 2025-12-01
tags:
  - React
draft: false
---

在 React 18 及其后续版本中，`useTransition` 和 `useDeferredValue` 是两个专门用于解决 **性能问题** 和 **提升用户体验** 的 Hook。它们都利用了 React 的 **并发特性 (Concurrent Features)**，将某些更新标记为“低优先级”，从而避免阻塞 UI 的交互。

简单来说：
*   **`useTransition`** 用于**状态更新**（State Update）。
*   **`useDeferredValue`** 用于**值**（Value）。

以下是详细的用法、区别和最佳实践。

---

## 1. `useTransition`

`useTransition` 允许你将某些状态更新标记为“过渡”（transition）。这意味着该更新是**低优先级**的，可以被中断。

**适用场景：**
当你点击一个按钮或标签页，导致页面发生大量渲染（例如切换到一个包含成千上万个组件的页面），而你希望保持 UI 的响应性（例如按钮点击态、悬停效果不卡顿）时使用。

**语法：**

```javascript
const [isPending, startTransition] = useTransition();
```

*   `isPending`: 布尔值，告诉你过渡是否正在进行中（可以用来显示加载状态）。
*   `startTransition`: 函数，用来包裹那个“昂贵”的状态更新。

**示例代码（Tab 切换）：**

```jsx
import { useState, useTransition } from 'react';
import TabButton from './TabButton';
import HeavyPage from './HeavyPage'; // 假设这是一个渲染很慢的组件

export default function App() {
  const [tab, setTab] = useState('home');
  // 使用 useTransition
  const [isPending, startTransition] = useTransition();

  function selectTab(nextTab) {
    // 将状态更新标记为 transition
    startTransition(() => {
      setTab(nextTab);
    });
  }

  return (
    <div>
      <div className="tabs">
        <TabButton onClick={() => selectTab('home')}>Home</TabButton>
        <TabButton onClick={() => selectTab('heavy')}>Heavy Page</TabButton>
      </div>

      {/* 如果正在 pending，可以显示旧 UI 或 loading 指示器 */}
      {isPending && <span>Loading...</span>}

      {tab === 'home' && <p>Home Page</p>}
      {tab === 'heavy' && <HeavyPage />}
    </div>
  );
}
```

**发生了什么？**
如果不使用 `startTransition`，点击 "Heavy Page" 会导致界面完全冻结，直到 `HeavyPage` 渲染完成。使用了 `startTransition` 后，React 会在后台渲染 `HeavyPage`，此时用户依然可以点击其他按钮，界面保持响应。

---

## 2. `useDeferredValue`

`useDeferredValue` 接受一个值，并返回该值的一个**延迟副本**。React 会先使用旧值进行渲染，然后在后台尝试使用新值进行渲染。

**适用场景：**
当你从父组件接收到一个新值（props），或者基于输入框（input）的值进行复杂的列表过滤时。你希望输入框保持流畅（高优先级），而列表的更新可以稍后进行（低优先级）。

**语法：**

```javascript
const deferredValue = useDeferredValue(value);
```

**示例代码（搜索过滤）：**

```jsx
import { useState, useDeferredValue, useMemo } from 'react';

export default function SearchApp() {
  const [query, setQuery] = useState('');
  
  // 生成一个延迟版本的 query
  // 当 query 变化时，deferredQuery 会滞后更新
  const deferredQuery = useDeferredValue(query);

  return (
    <div>
      {/* Input 使用原始的 query，保证输入不卡顿 */}
      <input 
        value={query} 
        onChange={e => setQuery(e.target.value)} 
        placeholder="Search..."
      />

      {/* 列表组件使用 deferredQuery */}
      <SlowList text={deferredQuery} />
    </div>
  );
}

// 模拟一个很慢的列表组件
const SlowList = ({ text }) => {
  // 注意：只有当 SlowList 被 memo 包裹或者其内部逻辑复杂时，并发渲染才有意义
  // 这里模拟耗时计算
  const items = useMemo(() => {
    const list = [];
    for (let i = 0; i < 10000; i++) {
      if (String(i).includes(text)) {
        list.push(<li key={i}>{i}</li>);
      }
    }
    return list;
  }, [text]);

  return <ul>{items}</ul>;
};
```

**发生了什么？**
当你快速输入 "123" 时：
1.  `query` 立即更新，`input` 框实时显示输入内容（高优先级）。
2.  `deferredQuery` 在这一刻可能还是旧值。
3.  React 会在后台使用新的 `deferredQuery` 渲染列表。如果用户继续打字，React 会中断后台渲染，优先处理输入。

---

## 3. 核心区别与选择 (useTransition vs useDeferredValue)

虽然它们达到的效果相似（都是非阻塞渲染），但使用场景不同：

| 特性 | `useTransition` | `useDeferredValue` |
| :--- | :--- | :--- |
| **控制权** | 你控制**更新函数** (Setters)。 | 你只能控制**数据** (Values)。 |
| **使用时机** | 当你可以调用 `setState` 时（例如 onClick, onChange 处理函数内部）。 | 当值是作为 Props 传递下来的，或者在 Hooks 链中（你无法直接控制 setter）时。 |
| **返回值** | `[isPending, startTransition]` (提供 pending 状态)。 | `deferredValue` (不直接提供 pending 状态，但可以比较值)。 |
| **典型例子** | 点击按钮切换页面/Tab。 | 搜索框输入导致的大列表过滤。 |

### 如何选择？

1.  **如果你能控制状态更新（setState）：** 优先使用 **`useTransition`**。因为它提供了 `isPending` 状态，你可以利用它来向用户展示“正在加载中”的反馈，体验更好。
2.  **如果你不能控制状态更新（例如值是从 props 传来的）：** 使用 **`useDeferredValue`**。这通常发生在组件库开发或深层子组件中。

## 4. 常见误区与注意事项

1.  **不要滥用**：不要把所有的状态更新都包在 `useTransition` 里。只有在导致 UI 卡顿的**重型渲染**时才使用。普通的输入、简单的开关切换不需要它。
2.  **受控输入框 (Controlled Inputs)**：
    *   **不建议**将输入框的 `onChange` 里的 `setState` 直接包裹在 `startTransition` 中。这会导致输入框本身变卡（因为回显变成了低优先级）。
    *   **正确做法**：输入框状态维持原样，另外分离出一个用于“重型渲染”的状态（或者使用 `useDeferredValue` 处理传递给重组件的值）。
3.  **防抖 (Debounce) vs 并发特性**：
    *   **Debounce (setTimeout)**：是**延迟**开始。比如停止打字 500ms 后才开始搜索。为了减少请求次数。
    *   **useDeferredValue**：是**立即**开始，但是是低优先级的。如果用户一直在打字，React 会不断中断渲染，只保留最后一帧。它主要用于优化**CPU 密集型**的渲染卡顿，而不是为了减少网络请求。
    *   *网络请求通常还是推荐用 Debounce，组件渲染卡顿用 useDeferredValue。*

## 总结

* 想要在**点击/交互**触发复杂更新时不阻塞 UI？ ➡️ 用 `useTransition`。
* 接收到一个新数据，想要延迟渲染基于该数据的**复杂视图**？ ➡️ 用 `useDeferredValue`。