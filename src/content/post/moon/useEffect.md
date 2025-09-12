title: "useEffect"
description: "介绍 useEffect 的执行时机与依赖数组规则，清理函数的作用及常见陷阱（闭包、无限循环、函数依赖），并给出实践示例与修复策略。"
publishDate: "2025-09-12"
tags: ["React", "useEffect", "Hooks", "依赖数组", "副作用"]
draft: false
type: Post
status: Published
date: 2025-07-27
category: 技术分享
---
### 1. useEffect 是什么？
`useEffect` 是一个 React Hook，它允许你在函数组件中执行**副作用（Side Effects）**。
**什么是副作用？**  
在 React 的世界里，组件的主要工作是根据 `props` 和 `state` 计算并渲染 UI。任何超出这个范畴的操作，比如与组件外部世界交互的行为，都可以被认为是副作用。
在类组件中，副作用通常在生命周期方法中处理，如 `componentDidMount`, `componentDidUpdate`, 和 `componentWillUnmount`。`useEffect` 可以看作是这三者的统一体。
### 2. 原理 (How it Works)
`useEffect` 的核心在于**“在渲染之后执行”**以及**“依赖项数组”**。
### 基本语法
```JavaScript
useEffect(() => {
  // 这里是你的副作用代码
  // 例如：API 请求、DOM 操作、设置订阅等
  return () => {
    // 这里是可选的清理代码
    // 例如：取消订阅、清除定时器、移除事件监听器
  };
}, [dependency1, dependency2, ...]); // 依赖项数组
```
### 工作流程
1. **执行时机**：`useEffect` 会在**每次组件渲染完成并更新到 DOM 之后**异步执行。这确保了 effect 函数不会阻塞浏览器的绘制。
2. **依赖项数组 (Dependency Array)**：这是 `useEffect` 的控制核心。React 会比较当前渲染和上一次渲染中依赖项数组里的值。
    - **如果数组为空** `**[]**`：Effect 只会在组件**首次挂载（mount）**后执行一次。这等同于类组件中的 `componentDidMount`。
    - **如果省略数组** `**undefined**`：Effect 会在**每一次组件渲染**后都执行。这通常是你想要避免的，因为它可能导致性能问题或无限循环。
    - **如果数组中有值** `**[prop, state]**`：Effect 会在首次挂失后执行，并且只有当数组中**任何一个值发生变化**时，才会在后续的渲染中重新执行。React 使用 `Object.is` 来比较依赖项。
3. **清理函数 (Cleanup Function)**：
    - `useEffect` 可以返回一个函数，这个函数被称为“清理函数”。
    - **执行时机**：
        1. 在组件**卸载（unmount）**时执行，用于最后的清理。等同于 `componentWillUnmount`。
        2. 在下一次 effect **重新执行之前**执行。这非常重要，它可以防止内存泄漏，确保上一个 effect 的“残留物”（如旧的订阅或定时器）被清理干净。
**总结原理**：React 组件渲染完成后，会检查 `useEffect` 的依赖项。如果这是第一次渲染，或者依赖项发生了变化，React 会先执行上一次 effect 的清理函数（如果存在），然后执行新的 effect 函数。当组件卸载时，会执行最后一次 effect 的清理函数。
---
### 3. 使用背景 (When to Use It)
当你需要在函数组件中处理以下场景时，就应该使用 `useEffect`：
- **数据获取 (Data Fetching)**：在组件挂载时从服务器获取数据。
- **设置订阅 (Subscriptions)**：监听 WebSocket 消息、浏览器事件（如 `resize`, `scroll`）或外部数据源。
- **手动操作 DOM (Manual DOM Mutations)**：当你需要直接操作 DOM，比如使用一个需要 DOM 节点的第三方库（如图表库 D3.js）。
- **设置定时器 (Timers)**：使用 `setTimeout` 或 `setInterval`。
- **日志记录或分析 (Logging and Analytics)**：当特定状态或属性变化时发送日志。
- **与浏览器 API 交互**：如 `localStorage`、`document.title` 等。
---
### 4. 注意事项 (Important Precautions)
1. **务必正确设置依赖项数组**
    - **使用 ESLint 插件**：官方推荐使用 `eslint-plugin-react-hooks` 插件，其中的 `exhaustive-deps` 规则会自动检查依赖项数组是否完整，并给出警告。
        - **不要说谎**：如果你的 effect 用到了某个 `prop` 或 `state`，就必须把它加到依赖项数组里。否则，你的 effect 会捕获到它第一次执行时的旧值（即“陈旧的闭包”），导致 bug。
2. **避免无限循环**
    - **场景**：在 effect 中更新了一个 state，而这个 state 又是 effect 的依赖项。
    - **错误示例**：
        
        ```JavaScript
        const [count, setCount] = useState(0);
        // 错误！这将导致无限循环
        useEffect(() => {
          setCount(count + 1);
        }, [count]);
        ```
        
    - **解决方案**：使用函数式更新 `setState(prev => ...)`，这样就不需要依赖 `count` 本身。
        
        ```JavaScript
        useEffect(() => {
          // 这样就不会无限循环，但仍需谨慎使用
          const interval = setInterval(() => {
            setCount(c => c + 1); // 使用函数式更新，不依赖外部的 count
          }, 1000);
          return () => clearInterval(interval);
        }, []); // 依赖项数组可以为空
        ```
        
3. **处理函数依赖**
    - 如果在组件内部定义的函数被用在 effect 中，并且作为依赖项，它会在每次渲染时都改变，导致 effect 不必要地重复执行。
    - **解决方案**：
        1. 将函数定义在 effect **内部**。
        2. 使用 `useCallback` Hook 包裹该函数，并为其自身设置正确的依赖项。
4. **处理数据请求中的竞态条件 (Race Condition)**
    - 当依赖项快速变化（如搜索框输入），可能会发出多个 API 请求。如果旧的请求比新的请求后返回，就会用旧数据覆盖新数据。
    - **解决方案**：在清理函数中取消请求。
        
        ```JavaScript
        useEffect(() => {
          const controller = new AbortController();
          const signal = controller.signal;
        
          fetch(`/api/data?q=${query}`, { signal })
            .then(res => res.json())
            .then(data => { /* ... */ })
            .catch(err => {
              if (err.name === 'AbortError') {
                console.log('Fetch aborted');
              }
            });
        
          return () => {
            // 当 effect 重新执行或组件卸载时，取消上一次的 fetch
            controller.abort();
          };
        }, [query]);
        ```
        
  
  
==在 React 的== ==`useEffect`== ==中，依赖数组（Dependency Array）是控制副作用执行时机的核心机制。以下是使用依赖数组的核心原则和最佳实践：==
### ==**1. 核心原则**==
### ==✅== ==**原则 1：包含所有 effect 内部使用的可变值**==
- ==**必须包含**== ==effect 内部使用的 props、state、context 或其他可能变化的值（如函数、对象等）。==
- ==**原因**====：避免闭包陷阱（使用过时的值）。==
- ==**示例**====：==
```JavaScript
function Example({ userId }) {
 const [count, setCount] = useState(0);
 // ❌ 错误：遗漏了 userId 和 count
 useEffect(() => {
 fetch(`/api/${userId}`).then(() => setCount(count + 1));
 }, []); // 空数组导致闭包问题
 // ✅ 正确：包含所有依赖
 useEffect(() => {
 fetch(`/api/${userId}`).then(() => setCount(count + 1));
 }, [userId, count]); // 依赖 userId 和 count
}
```
### ==✅== ==**原则 2：避免不必要的依赖**==
- ==**不要包含**== ==永不变化的值（如常量、函数组件外部定义的函数）。==
- ==**原因**====：减少 effect 的无效执行，提升性能。==
- ==**示例**====：==
```JavaScript
const API_ENDPOINT = "/api/data"; // 常量
function Example() {
  // ✅ 正确：常量无需加入依赖
  useEffect(() => {
    fetch(API_ENDPOINT);
  }, []); // 空数组即可
  // ❌ 错误：常量加入依赖无意义
  useEffect(() => {
    fetch(API_ENDPOINT);
  }, [API_ENDPOINT]); // 不必要的依赖
}
```
### ==✅== ==**原则 3：稳定引用类型依赖**==
- ==**问题**====：对象、数组、函数等引用类型每次渲染都会创建新引用，导致 effect 频繁执行。==
- ==**解决方案**====：==
- ==**对象/数组**====：用== ==`useMemo`== ==缓存。==
- ==**函数**====：用== ==`useCallback`== ==缓存。==
- ==**示例**====：==
```JavaScript
function Example({ userId }) {
  const [count, setCount] = useState(0);
  // ❌ 错误：handleClick 每次渲染都是新函数
  const handleClick = () => {
    console.log(count);
  };
  useEffect(() => {
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [handleClick]); // 每次渲染都重新绑定事件
  // ✅ 正确：用 useCallback 稳定函数引用
  const handleClick = useCallback(() => {
    console.log(count);
  }, [count]); // 仅当 count 变化时更新函数
  useEffect(() => {
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [handleClick]); // 现在依赖稳定
}
```
### ==✅== ==**原则 4：空依赖数组（**====`**[]**`====**）的特殊性**==
- ==**含义**====：effect== ==**仅在挂载时执行一次**====（类似== ==`componentDidMount`====）。==
- ==**适用场景**====：==
- ==初始化操作（如订阅事件、获取初始数据）。==
- ==**必须确保**== ==effect 内部不依赖任何会变化的值（否则闭包陷阱）。==
- ==**示例**====：==
```JavaScript
useEffect(() => {
  const timer = setInterval(() => {
    console.log("Tick");
  }, 1000);
  return () => clearInterval(timer); // 清理函数
}, []); // ✅ 仅挂载时执行
```
### ==**2. 常见问题与解决方案**==
### ==❌== ==**问题 1：遗漏依赖导致闭包陷阱**==
- ==**现象**====：effect 内部使用过时的 props/state。==
- ==**解决**====：添加所有依赖或使用函数式更新。==
```JavaScript
// 使用函数式更新避免依赖 count
useEffect(() => {
  const timer = setInterval(() => {
    setCount((c) => c + 1); // ✅ 不依赖外部 count
  }, 1000);
  return () => clearInterval(timer);
}, []); // 空数组安全
```
### ==❌== ==**问题 2：依赖变化导致无限循环**==
- ==**现象**====：依赖数组包含频繁变化的值（如每次渲染都变的对象）。==
- ==**解决**====：==
- ==用== ==`useMemo`====/====`useCallback`== ==稳定引用。==
- ==拆分依赖（仅依赖必要的属性）。==
```JavaScript
// 拆分依赖：仅依赖 userId 而非整个 user 对象
useEffect(() => {
  fetch(`/api/${user.id}`);
}, [user.id]); // ✅ 而非 [user]
```
### ==❌== ==**问题 3：过度依赖导致性能问题**==
- ==**现象**====：effect 执行过于频繁。==
- ==**解决**====：==
- ==移除不必要的依赖（如常量）。==
- ==使用== ==`useMemo`====/====`useCallback`== ==减少依赖变化。==
- ==用== ==`useRef`== ==存储可变值（但需谨慎）。==
### ==**3. 最佳实践总结**==
|==场景==|==依赖数组==|==示例==|
|---|---|---|
|==**仅挂载时执行**==|==`[]`==|==`useEffect(() => { ... }, [])`==|
|==**依赖 state/props**==|==`[state, props]`==|==`useEffect(() => { ... }, [count])`==|
|==**依赖对象/数组**==|==`[obj.prop]`==|==`useEffect(() => { ... }, [user.id])`==|
|==**依赖函数**==|==`useCallback`==|==`const fn = useCallback(() => {}, [dep])`==|
|==**避免闭包陷阱**==|==函数式更新==|==`setCount(c => c + 1)`==|
### ==**4. 工具辅助**==
- ==**ESLint 插件**====：==
==使用== ==`eslint-plugin-react-hooks`== ==自动检测依赖问题：==
```JSON
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/exhaustive-deps": "warn" // 提示遗漏的依赖
  }
}
```
- ==**React DevTools**====：==
==通过 Profiler 检查 effect 的执行频率。==
### ==**关键结论**==
1. ==**依赖数组必须完整**====：包含所有 effect 内部使用的可变值。==
2. ==**依赖数组必须精简**====：排除永不变化的值。==
3. ==**稳定引用类型**====：用== ==`useMemo`====/====`useCallback`== ==避免频繁重建。==
4. ==**空数组需谨慎**====：确保 effect 不依赖任何可变值。==
==遵循这些原则，可以避免 90% 的== ==`useEffect`== ==相关 bug，并保证副作用的正确执行时机。==
