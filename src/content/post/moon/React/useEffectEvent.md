---
title: useEffectEvent
description: ""
publishDate:  2025-10-18
tags:
  - Hooks
draft: false
---

useEffectEvent 是 React 在 **v19（或 React Canary 版本）** 引入的新特性，用来更优雅地解决 **Effect 中使用回调函数时的“闭包陷阱（stale closure）”** 问题。

---

## **🔍 一、背景问题：Effect 的闭包陷阱**



在 React 中，如果你在 useEffect 里引用了一个会变化的函数或状态，就会出现“闭包陷阱”。例如：

```javascript
function MyComponent() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      console.log(count); // ⚠️ 闭包陷阱：始终打印初始 count！
    }, 1000);
    return () => clearInterval(id);
  }, []); // 依赖数组为空！
}
```

> 因为 useEffect 的依赖数组是空的，React 永远不会重新运行这个 Effect，导致 count 始终是初始值。

---

## **🧩 二、传统解决方案（比较笨）**



传统上我们可以：

1. 把 count 加进依赖数组（但这会频繁清理 & 重建 setInterval）；
    
2. 或用 useRef 保存最新值（可行但样板代码多）：

```javascript
const countRef = useRef(count);
useEffect(() => {
  countRef.current = count;
});
```

---

## ⚡ 三、useEffectEvent 的出现



React 官方引入了 **useEffectEvent** 来让你定义一个 **在 Effect 外部定义、但在 Effect 内部调用的“稳定回调函数”**。

这样，你既能访问最新的状态，又不会导致 Effect 重新执行。

---

```javascript
import { useEffect, useState, useEffectEvent } from "react";

function MyComponent() {
  const [count, setCount] = useState(0);

  const onTick = useEffectEvent(() => {
    console.log(count); // 始终拿到最新的 count！
  });

  useEffect(() => {
    const id = setInterval(() => {
      onTick(); // ✅ 稳定的事件回调
    }, 1000);
    return () => clearInterval(id);
  }, [onTick]); // [onTick] 是稳定的，不会变化
}
```

---

## **💡 四、原理简述**

- useEffectEvent 返回一个**稳定的函数引用**（不会因为依赖变化而重建）。
    
- React 内部保证这个函数每次调用时都能访问最新的组件状态和 props。
    
- 它不能在渲染期间或组件外部调用，只能在 effect 或事件中使用。

---

## **🚫 五、限制与注意事项**

1. **只能在组件内部调用**；
    
2. **不能在渲染期间直接调用**（只能在 useEffect、事件处理器或回调中）；
    
3. **不要放入依赖数组**（它本身稳定）；
    
4. **主要用于 effect 内部引用最新逻辑**，不是通用的事件钩子。

---

## **🧠 六、适用场景总结**

|**场景**|**是否适合使用** useEffectEvent|
|---|---|
|setInterval、setTimeout 内引用最新状态|✅ 非常合适|
|WebSocket 或订阅监听函数中使用状态|✅ 合适|
|普通按钮点击事件（直接在组件内定义）|❌ 没必要|
|想避免在依赖数组中频繁添加状态/函数|✅ 有效|

---

## **🔚 七、简短总结**

|**功能**|useEffectEvent **的意义**|
|---|---|
|🔄 稳定性|返回的函数引用不会变|
|🧠 状态同步|每次调用都能访问最新的 state/props|
|🚫 避免重跑|不会导致 effect 不必要地重执行|
|🧩 用途|解决 effect 内的闭包陷阱问题|

---
