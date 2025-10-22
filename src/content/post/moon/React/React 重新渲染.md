---
title: React 重新渲染
description: "深入探讨 React 重新渲染的触发时机、过程、与 DOM 更新的区别，以及如何通过 Memoization 等技术优化性能。"
publishDate:  2025-10-22
tags:
  - React
  - Performance
draft: false
---

## 🔄 React 重新渲染：何时发生，如何优化？

“重新渲染”是 React 更新 UI 的核心机制，但它也是性能问题的常见来源。理解其工作原理对于编写高效的 React 应用至关重要。

---

### 1. 触发重新渲染的“三驾马车”

React 组件的重新渲染主要由以下三个原因触发：

#### **a. State 变化**

> 当组件的 `state` 通过 `setState` (或 `useState` 的 `set` 函数) 更新时，React 会安排该组件及其所有子组件重新渲染。

这是最常见的触发方式。

```javascript
function Counter() {
  const [count, setCount] = React.useState(0);

  // 每次点击，都会触发 Counter 组件的重新渲染
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

**注意**：React 会进行批量更新（batching）。在同一个事件循环中多次调用 `setState`，通常只会触发一次重新渲染。

#### **b. Props 变化**

> 当父组件重新渲染时，它会默认重新渲染其所有子组件，并将新的 `props` 传递下去。

即使 `props` 的值没有改变，子组件也会重新渲染。

```javascript
function Parent() {
  const [count, setCount] = React.useState(0);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Re-render Parent</button>
      {/* 即使 Child 的 props 没有变，它也会重新渲染 */}
      <Child /> 
    </div>
  );
}

function Child() {
  console.log('Child re-rendered');
  return <div>I am a child</div>;
}
```

#### **c. Context 变化**

> 当一个组件订阅了某个 `Context`，并且该 `Context` 的值发生变化时，该组件会重新渲染。

```javascript
const ThemeContext = React.createContext('light');

function App() {
  const [theme, setTheme] = React.useState('light');

  return (
    <ThemeContext.Provider value={theme}>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
      <Toolbar />
    </ThemeContext.Provider>
  );
}


```javascript
function Toolbar() {
  // Toolbar 本身不消费 context，但它会因为 App 的 state 变化而重渲染
  return <ThemedButton />;
}
```

```javascript
function ThemedButton() {
  const theme = React.useContext(ThemeContext); // 订阅了 context
  console.log('ThemedButton re-rendered due to context change');
  return <button>Theme is {theme}</button>;
}
```

当 `ThemeContext.Provider` 的 `value` 改变时，所有消费该 `context` 的组件（这里是 `ThemedButton`）都会重新渲染。

---

### 2. 重新渲染 ≠ DOM 更新

这是一个至关重要的概念：

- **重新渲染 (Re-render)**：是 React 在内存中调用组件函数，生成新的虚拟 DOM (Virtual DOM) 树的过程。这个过程很快。
- **DOM 更新 (DOM Update)**：是 React 将新的虚拟 DOM 树与旧的进行比较（这个过程叫 **Reconciliation** 或 **Diffing**），然后只将差异部分更新到真实 DOM 的过程。这个过程相对较慢，因为它涉及浏览器操作。

> React 的核心优势在于，它通过 diff 算法，将昂贵的 DOM 更新最小化。即使一个组件重新渲染了，如果其输出的虚拟 DOM 没有变化，React 也不会去操作真实的 DOM。

```javascript
function Parent() {
  const [count, setCount] = React.useState(0);

  console.log('Parent re-rendered');

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Re-render Parent</button>
      {/* StaticChild 每次都会重新渲染，但其虚拟 DOM 不变，所以真实 DOM 不会更新 */}
      <StaticChild />
    </div>
  );
}


```javascript
function StaticChild() {
  console.log('StaticChild re-rendered');
  return <div>I am a static child</div>;
}
```

在这个例子中，每次点击按钮：

1. `Parent` 和 `StaticChild` 都会重新渲染（控制台会打印日志）。
2. 但 `StaticChild` 的输出始终是 `<div>I am a static child</div>`，没有变化。
3. 因此，React 不会去更新 `StaticChild` 对应的真实 DOM。


在这个例子中，每次点击按钮：
1. `Parent` 和 `StaticChild` 都会重新渲染（控制台会打印日志）。
2. 但 `StaticChild` 的输出始终是 `<div>I am a static child</div>`，没有变化。
3. 因此，React 不会去更新 `StaticChild` 对应的真实 DOM。

---

### 3. 优化重新渲染：Memoization

虽然 React 已经很智能，但有时“重新渲染”本身也会成为性能瓶颈（例如，组件函数中有复杂计算）。这时，我们可以使用 **Memoization** (记忆化) 技术来跳过不必要的重新渲染。

#### **a. `React.memo`：用于组件**

> `React.memo` 是一个高阶组件，它会“记住”一个组件的渲染结果。如果该组件的 `props` 没有发生变化，React 会跳过这次重新渲染，直接复用上次的结果。

```javascript
function Parent() {
  const [count, setCount] = React.useState(0);
  const [name, setName] = React.useState('Alice');

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Re-render Parent</button>
      <input value={name} onChange={e => setName(e.target.value)} />
      
      {/* 当只有 name 变化时，MemoizedChild 不会重新渲染 */}
      <MemoizedChild count={count} />
    </div>
  );
}


```javascript
const MemoizedChild = React.memo(function Child({ count }) {
  console.log('MemoizedChild re-rendered');
  return <div>Count is {count}</div>;
});
```

**效果**：

- 点击按钮：`count` 改变，`MemoizedChild` 重新渲染。
- 修改输入框：`name` 改变，`Parent` 重新渲染，但 `MemoizedChild` 的 `count` prop 没变，所以它**不会**重新渲染。

**效果**：
- 点击按钮：`count` 改变，`MemoizedChild` 重新渲染。
- 修改输入框：`name` 改变，`Parent` 重新渲染，但 `MemoizedChild` 的 `count` prop 没变，所以它**不会**重新渲染。

#### **b. `useMemo`：用于值**

> `useMemo` 用于“记住”一个计算结果。只有当依赖项发生变化时，它才会重新计算。

这对于避免在每次渲染时都执行昂贵的计算非常有用。

```javascript
function TodoList({ todos, filter }) {
  // 每次渲染都会重新计算，即使 todos 和 filter 没变
  // const visibleTodos = filterTodos(todos, filter);

  // 使用 useMemo，只有当 todos 或 filter 变化时才重新计算
  const visibleTodos = React.useMemo(() => {
    console.log('Filtering todos...');
    return filterTodos(todos, filter); // 假设 filterTodos 是一个昂贵的函数
  }, [todos, filter]);

  return (
    <ul>
      {visibleTodos.map(todo => <li key={todo.id}>{todo.text}</li>)}
    </ul>
  );
}
```

#### **c. `useCallback`：用于函数**

> `useCallback` 用于“记住”一个函数定义。只有当依赖项发生变化时，它才会返回一个新的函数实例。

这通常与 `React.memo` 结合使用，以防止因为函数作为 prop 传递而导致不必要的重新渲染。

```javascript
const MemoizedButton = React.memo(function Button({ onClick }) {
  console.log('Button re-rendered');
  return <button onClick={onClick}>Click me</button>;
});
```

**为什么？**

- 如果不使用 `useCallback`，每次 `App` 重新渲染时，`handleClick` 都是一个全新的函数。
- `MemoizedButton` 接收到的 `onClick` prop 每次都不同（即使函数体一样），因此 `React.memo` 会失效。
- `useCallback` 保证了 `onClick` prop 的引用稳定性。

```javascript
function App() {
  const [count, setCount] = React.useState(0);

  // 每次 App 重新渲染，都会创建一个新的 handleClick 函数
  // const handleClick = () => {
  //   console.log('Button clicked');
  // };

  // 使用 useCallback，handleClick 函数实例被“记住”了
  const handleClick = React.useCallback(() => {
    console.log('Button clicked');
  }, []); // 空依赖数组意味着函数永不改变

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      {/* 如果不使用 useCallback，MemoizedButton 每次都会重新渲染 */}
      <MemoizedButton onClick={handleClick} />
    </div>
  );
}
```

**为什么？**
- 如果不使用 `useCallback`，每次 `App` 重新渲染时，`handleClick` 都是一个全新的函数。
- `MemoizedButton` 接收到的 `onClick` prop 每次都不同（即使函数体一样），因此 `React.memo` 会失效。
- `useCallback` 保证了 `onClick` prop 的引用稳定性。

---

### 4. 总结

|触发方式|描述|优化策略|
|---|---|---|
|**State 变化**|`setState` 或 `useState` 的 `set` 函数被调用|将状态下移到更小的组件中，避免影响整个子树|
|**Props 变化**|父组件重新渲染，导致子组件接收新 `props`|使用 `React.memo` 包裹子组件，避免因无关 `props` 变化导致重渲染|
|**Context 变化**|消费的 `Context` 值发生变化|将 `Context` 拆分为更小的部分，或将组件拆分为消费部分和非消费部分|



**核心原则**：

1. **重新渲染是正常的**：不要过度优化。首先要让代码工作，然后再去分析性能瓶颈。
2. **区分渲染和 DOM 更新**：React 已经为你处理了大部分 DOM 性能问题。
3. **使用 Memoization**：当遇到具体性能问题时，才使用 `React.memo`, `useMemo`, `useCallback` 来精确控制重新渲染。
