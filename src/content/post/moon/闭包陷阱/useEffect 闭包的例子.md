---
title: "useEffect 闭包的例子"
description: "以键盘事件为例说明 useEffect 的陈旧闭包问题，先用函数式更新修正逻辑，再结合 useCallback 稳定函数引用，避免频繁解绑/绑定。"
publishDate: "2025-09-12"
tags: ["React", "useEffect", "闭包", "Hooks", "性能优化"]
draft: false
---

### 背景介绍：一个简单的需求引发的思考
在开发一个基于 React 的 2048 游戏时，我们遇到了一个常见的需求：允许用户通过键盘的上下左右方向键来操作游戏。在 React 中，处理这种需要与浏览器 DOM 或 BOM API 交互的“副作用”（Side Effect），最自然的工具就是 `useEffect` Hook。
我们的目标很简单：
1. 在组件挂载时，给 `window` 对象添加一个 `keydown` 事件监听器。
2. 在组件卸载时，移除这个监听器以防止内存泄漏。
3. 当监听到按键时，调用相应的游戏逻辑函数（如 `moveUp`, `moveDown` 等）来更新棋盘状态。
然而，这个看似简单的任务，却是一个绝佳的学习机会，它完美地揭示了 React Hooks 中关于**状态、闭包、依赖和性能优化**的核心概念。接下来，我们将通过三个阶段的演进，展示从一个有 Bug 的初始版本到一个健壮、高效的最佳实践方案的全过程。
---
### 阶段一：初版实现与“过时状态”的闭包陷阱
作为初次尝试，我们很自然地会写出以下代码：
```TypeScript
// 场景一：有闭包陷阱的版本
const GameBoard = () => {
    const [board, setBoard] = useState(initialBoard);
    // 一个普通的移动处理函数
    const handleMove = (moveFn) => {
        // 这里的 `board` 是从组件作用域中捕获的
        const newBoard = moveFn(board);
        if (!areBoardsEqual(board, newBoard)) {
            setBoard(newBoard);
        }
    };
    useEffect(() => {
        const handleKeyDown = (event) => {
            // ... 根据 event.key 调用 handleMove ...
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []); // <-- 依赖数组为空，我们希望 effect 只运行一次
};
```
**问题分析：**
这段代码存在一个致命的 Bug，即**过时状态 (Stale State)**，其根源在于 **JavaScript 的闭包机制**。
1. **初始渲染时**：`useEffect` 的回调函数被执行。它内部创建的 `handleKeyDown` 函数捕获了（或者说“闭包了”）当时作用域中的所有变量，包括 `handleMove` 函数。而这个 `handleMove` 函数，又闭包了当时的 `board` 状态，也就是 `initialBoard`。
2. `**useEffect**` **的依赖数组为** `**[]**`：这意味着这个 effect 只会在组件首次挂载时运行一次，之后无论组件如何重渲染，它都不会再次运行。
3. **第一次按键后**：状态 `board` 被更新，组件重渲染。但由于 effect 没有重新运行，`window` 上挂着的事件监听器**仍然是最初创建的那个**。
4. **第二次按键时**：被调用的依然是那个“活在过去”的监听器。它所引用的 `handleMove` 函数依然认为 `board` 的值是 `initialBoard`。因此，所有的计算都是基于一个过时的状态，游戏逻辑完全失效。
**结论：** 这是一个典型的闭包陷阱。我们试图通过 `[]` 来优化性能，却意外地让我们的事件监听器与组件的最新状态脱钩。
---
### 阶段二：函数式更新救场，但引入了新问题
为了解决“过时状态”问题，我们可以使用 `setState` 的**函数式更新**形式。这种形式可以保证我们总能拿到最新的状态。
```TypeScript
// 场景二：逻辑正确，但不符合最佳实践
const GameBoard = () => {
    const [board, setBoard] = useState(initialBoard);
    const handleMove = (moveFn) => {
        // 使用函数式更新，React 会传入最新的 state
        setBoard(currentBoard => {
            const newBoard = moveFn(currentBoard);
            // ... 比较并返回新 board 或旧 board
            return newBoard;
        });
    };
    useEffect(() => {
        const handleKeyDown = (event) => { /* ... */ };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleMove]); // <-- 为了遵守规则，必须将 handleMove 添加到依赖
};
```
**分析：**
1. **逻辑正确性 ✓**：通过 `setBoard(currentBoard => ...)`，我们不再依赖外部作用域的 `board` 变量。React 确保 `currentBoard` 永远是执行更新时最新的状态。闭包陷阱被完美解决。
2. **新的性能问题 ✗**：
    - `handleMove` 是一个在 `GameBoard` 组件内部定义的普通函数。这意味着**每次组件重渲染时，它都会被重新创建**，得到一个新的函数引用。
    - `useEffect` 现在依赖于 `[handleMove]`。由于 `handleMove` 的引用在每次渲染后都会改变，`useEffect` 的清理函数和回调函数也**会在每一次按键导致重渲染后被重新执行**。
    - 这导致了不必要的性能开销：**每一次按键，都在频繁地移除旧监听器、添加新监听器**。对于简单的 `keydown` 事件影响不大，但这是一个不良的编程模式。
**结论：** 我们解决了逻辑 Bug，但牺牲了性能，并且代码模式不够优雅。
---
### 阶段三：最佳实践 —— `useCallback` 与函数式更新的强强联合
为了同时实现逻辑正确性和高性能，我们需要引入 `useCallback` Hook。
`useCallback` 的作用是**“记住”一个函数**。只有当它的依赖项改变时，它才会重新创建一个新的函数。
```TypeScript
// 场景三：推荐的最佳实践方案
const GameBoard = () => {
    const [board, setBoard] = useState(initialBoard);
    // 使用 useCallback 包裹，并提供空依赖数组
    const handleMove = useCallback((moveFn) => {
        setBoard(currentBoard => { // 1. 函数式更新保证逻辑正确
            // ...
            return newBoard;
        });
    }, []); // 2. 空依赖数组，保证 handleMove 的引用永久稳定
    useEffect(() => {
        const handleKeyDown = (event) => { /* ... */ };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleMove]); // 3. 依赖项 handleMove 是稳定的，effect 只会运行一次
};
```
**方案分析：**
这个方案是完美的，因为它同时解决了两个层面的问题：
1. **逻辑的正确性**：由**函数式更新**保证。`handleMove` 内部总能访问到最新的状态。
2. **引用的稳定性**：由 `useCallback(..., [])` 保证。因为依赖数组为空，`useCallback` 只在组件初次渲染时创建一次 `handleMove` 函数，之后始终返回这同一个函数引用。
由于 `handleMove` 的引用是稳定的，`useEffect` 的依赖项 `[handleMove]` 也永远不会改变。因此，`useEffect` 实现了我们最初的期望：**只在组件挂载时添加一次监听器，在卸载时清理一次**，高效且健壮。
### 总结
|方案|优点|缺点|核心概念|
|---|---|---|---|
|**阶段一：普通函数 + 空依赖**|实现简单|**存在严重的“过时状态”Bug**|闭包陷阱|
|**阶段二：函数式更新 + 依赖函数**|逻辑正确，解决了Bug|每次渲染都重新绑定/解绑事件，**性能低下**|函数式更新|
|**阶段三：函数式更新 +** `**useCallback**`|**逻辑正确，性能高，代码优雅**|需要理解 `useCallback` 的作用|**引用稳定性和依赖管理**|
通过这个 2048 游戏键盘监听器的例子，我们深入理解了 React Hooks 的工作流。编写健壮的 React 应用，不仅要实现功能，更要深刻理解状态、闭包和 Hooks 依赖系统如何协同工作，从而写出既正确又高效的代码。
