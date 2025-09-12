title: "React useRef 的使用"
description: "介绍 useRef 的原理与常见用法：访问 DOM、存储不触发渲染的可变数据，并给出聚焦输入框与定时器等示例。"
publishDate: "2025-09-12"
tags: ["React", "useRef", "Hooks", "DOM", "前端"]
draft: false
type: Post
status: Published
date: 2025-07-16
category: 技术分享
---
### `useRef` 概览
`useRef` 是一个 React Hook，它允许你在函数组件中创建一个可变的、持久化的引用。它就像是为你的组件实例提供了一个“盒子”，你可以在这个盒子里存放任何可变的值，并且这个“盒子”在组件的整个生命周期内都保持不变。
`use.Ref` 主要有两个核心用途：
1. **访问 DOM 节点**：获取对 JSX 中渲染的 DOM 元素的直接引用。
2. **存储可变数据**：存储一个不希望触发组件重新渲染的可变值，类似于类组件中的实例属性（`this.xxx`）。
---
### 1. 原理 (How it Works)
要理解 `useRef` 的原理，核心在于理解它如何 **在多次渲染之间保持不变**。
当你调用 `const myRef = useRef(initialValue);` 时，React 在内部会执行以下操作：
1. **创建对象**：创建一个简单的 JavaScript 对象，形如 `{ current: initialValue }`。
2. **与组件实例关联**：React 会将这个对象存储在与当前组件实例相关联的一个内部位置。这个存储位置独立于组件的渲染逻辑。
3. **返回同一对象**：在组件的后续每一次重新渲染时，当你再次调用 `useRef` 时，React **不会** 创建新的 ref 对象。相反，它会返回在首次渲染时创建的 **同一个对象**。
正是因为 React 始终返回同一个对象引用，所以无论你的组件重新渲染多少次，`myRef` 这个变量本身（它指向那个 ref 对象）和 `myRef.current` 属性的值都能被保留下来。
**与普通变量的对比：**
```JavaScript
function MyComponent() {
  // 每次渲染都会被重置为 0
  let myVar = 0;
  myVar++;
  console.log("myVar:", myVar); // 总是输出 1
  // ref 在多次渲染之间保持不变
  const myRef = useRef(0);
  myRef.current++;
  console.log("myRef.current:", myRef.current); // 依次输出 1, 2, 3, ...
  // ...
}
```
---
### 2. 特性 (Characteristics)
`useRef` 具有以下几个关键特性：
1. **返回一个可变对象**：`useRef` 返回一个带有 `.current` 属性的对象。你可以自由地读取和修改 `ref.current` 的值。
2. **跨渲染周期持久化**：`ref` 对象在组件的整个生命周期内保持不变。它的 `.current` 属性值可以被持久化。
3. **不触发重新渲染**：**这是** `**useRef**` **与** `**useState**` **最本质的区别。** 当你修改 `ref.current` 的值时，React **不会** 触发组件的重新渲染。这是因为它仅仅是一个普通的 JavaScript 对象属性的变更，React 的渲染机制不会追踪它。
4. **同步更新**：对 `ref.current` 的修改是同步的。当你执行 `myRef.current = newValue` 后，可以立即读到新值，不像 `useState` 的 `setState` 是异步的（在批处理中更新）。
---
### 3. 使用场景 (Use Cases)
`useRef` 的使用场景主要分为两大类。
### 场景一：访问和操作 DOM 元素 (最常用)
这是 `useRef` 最为人熟知的用途。当你需要直接与 DOM 交互时，比如获取焦点、测量尺寸、触发动画等，就需要一个对 DOM 节点的直接引用。
**步骤：**
1. 使用 `useRef(null)` 创建一个 ref。
2. 将这个 ref 通过 `ref` 属性附加到你想引用的 JSX 元素上。
3. 在 `useEffect` 或事件处理函数中，通过 `ref.current` 访问该 DOM 节点。
**为什么在** `**useEffect**` **中访问？**  
因为在组件首次渲染时，DOM 节点还未创建，`ref.current` 的值为 `null`。`useEffect` 的回调函数会在组件挂载到 DOM **之后** 执行，此时 `ref.current` 才会被赋值为对应的 DOM 节点。
**示例：点击按钮让输入框自动聚焦**
```JavaScript
import React, { useRef, useEffect } from 'react';
function TextInputWithFocusButton() {
  // 1. 创建一个 ref
  const inputEl = useRef(null);
  const onButtonClick = () => {
    // 3. 通过 ref.current 访问 DOM 节点并调用其方法
    if (inputEl.current) {
      inputEl.current.focus();
    }
  };
  // 也可以在 useEffect 中实现组件加载后自动聚焦
  useEffect(() => {
    // 组件挂载后，DOM 节点可用
    inputEl.current.focus();
  }, []); // 空依赖数组确保只在挂载时运行一次
  return (
    <>
      {/* 2. 将 ref 附加到 input 元素 */}
      <input ref={inputEl} type="text" />
      <button onClick={onButtonClick}>Focus the input</button>
    </>
  );
}
```
**其他 DOM 相关用例：**
- **媒体播放**：控制 `<video>` 或 `<audio>` 元素的播放、暂停。
- **触发动画**：获取元素以应用 CSS 动画或使用 Animation API。
- **集成第三方库**：某些库（如 D3.js, JQuery 插件）需要一个真实的 DOM 节点作为挂载点。
- **测量元素尺寸或位置**：通过 `ref.current.getBoundingClientRect()` 获取元素的几何信息。
---
### 场景二：存储不触发 UI 更新的可变数据
当你需要在多次渲染之间共享和修改某个值，但这个值的变化又**不需要**反映在 UI 上时，`useRef` 是完美的工具。这避免了因 `useState` 导致的非必要渲染，提升了性能。
**示例：存储定时器 ID**
假设我们要做一个秒表，需要一个 `setInterval` 定时器。我们需要在某个地方存储定时器的 ID，以便之后能用 `clearInterval` 来清除它。这个 ID 本身不需要在界面上显示。
```JavaScript
import React, { useState, useRef } from 'react';
function Stopwatch() {
  const [count, setCount] = useState(0);
  // 使用 useRef 存储定时器 ID。如果用 useState，每次启动/停止都会触发不必要的渲染。
  const timerIdRef = useRef(null);
  const handleStart = () => {
    if (timerIdRef.current) return; // 防止重复启动
    timerIdRef.current = setInterval(() => {
      // 注意：这里使用函数式更新，因为闭包会捕获旧的 count 值
      setCount(prevCount => prevCount + 1);
    }, 1000);
  };
  const handleStop = () => {
    clearInterval(timerIdRef.current);
    timerIdRef.current = null;
  };
  return (
    <div>
      <p>Timer: {count}s</p>
      <button onClick={handleStart}>Start</button>
      <button onClick={handleStop}>Stop</button>
    </div>
  );
}
```
**其他数据存储用例：**
- **存储上一次的状态**：创建一个自定义 Hook `usePrevious` 来追踪 props 或 state 的上一个值。
    
    ```JavaScript
    function usePrevious(value) {
      const ref = useRef();
      useEffect(() => {
        ref.current = value;
      }); // 每次渲染后更新 ref
      return ref.current; // 返回的是上一次渲染时的值
    }
    
    // 在组件中使用
    const prevCount = usePrevious(count);
    ```
    
- **缓存计算结果**：当某个计算很昂贵，但你又不希望它的变化触发渲染时（可能只是为了内部逻辑使用）。
- **跟踪一个 WebSocket 连接实例**。
---
### 4. 注意事项 (Precautions)
1. `**ref.current**` **在首次渲染时为** `**null**` (当用于 DOM 时)  
    如前所述，直接在组件函数体（渲染逻辑）中访问 `ref.current` 来操作 DOM 是不可靠的，因为它通常是 `null`。务必在 `useEffect` 或事件回调中使用。
2. **避免滥用** `**useRef**` **来管理状态**  
    如果一个值的改变需要被用户看到（即更新 UI），**请务必使用** `**useState**` **或** `**useReducer**`。`useRef` 是一种“逃生舱”，用于处理命令式、副作用性质的代码。滥用它会破坏 React 的声明式编程模型，让数据流变得混乱和不可预测。
    
    **反模式（不要这样做）：**
    
    ```JavaScript
    function BadCounter() {
      const countRef = useRef(0);
    
      const handleClick = () => {
        countRef.current++;
        // UI 不会更新！countRef 的变化被 React 忽略了
        console.log("Current count:", countRef.current);
      };
    
      // 你的 UI 永远显示的是 0
      return <button onClick={handleClick}>Count: {countRef.current}</button>;
    }
    ```
    
3. `**useRef**` **的内容不会通知你变化**  
    因为修改 `ref.current` 不会触发重新渲染，所以依赖于 ref 值的其他计算或 `useEffect` 也不会自动重新执行。React 对 `ref.current` 的变化是“无感”的。
4. **在转发 Refs 时使用** `**React.forwardRef**`  
    如果你想将一个 `ref` 从父组件传递到子组件内部的某个 DOM 元素，不能直接通过 props 传递 `ref`。你需要使用 `React.forwardRef` 来包装子组件。
---
### 总结：`useRef` vs `useState`
|特性 (Feature)|`useRef`|`useState`|
|---|---|---|
|**主要目的**|访问DOM 或存储不触发渲染的可变数据|管理组件状态，其变化会触发UI更新|
|**返回值**|一个包含 `.current` 属性的对象 (`{ current: ... }`)|一个值和更新该值的函数 (`[value, setValue]`)|
|**值如何变化**|直接修改 `.current` 属性 (`myRef.current = ...`)|通过 setter 函数更新 (`setValue(...)`)|
|**更新行为**|同步的，直接修改|异步的，通过调度更新，可能会被批处理|
|**是否触发重渲染**|**否**|**是**|
|**典型用例**|DOM引用、定时器ID、实例变量|表单输入、UI状态（如开关）、服务器数据|
`useRef` 是 React Hooks 工具箱中一个强大而精准的工具。正确理解它的原理和适用场景，可以帮助你编写出更高效、更清晰的 React 组件。
