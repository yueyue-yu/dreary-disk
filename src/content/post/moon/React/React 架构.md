---
title: React 架构
description: ""
publishDate:  2025-11-16
tags: []
draft: false
---




React 的架构可以分为几个核心模块，它们协同工作，实现了我们所熟知的声明式 UI 开发体验。现代 React (16.x 及以后) 的核心架构被称为 **Fiber 架构**。

## 核心理念：从关注 “结果” 到关注 “过程”

在讲解具体模块之前，先理解一个核心思想的转变：

*   **旧架构 (Stack Reconciler, React 15 及之前):** 工作方式是递归的、不可中断的。当一个更新开始时，React 会递归遍历整个组件树，找出差异，然后一次性更新到 DOM 上。如果组件树很大，这个过程会长时间占用浏览器主线程，导致页面卡顿、掉帧，用户输入无响应。
*   **新架构 (Fiber Reconciler, React 16+):** 核心目标是实现**异步可中断更新**。React 将庞大的更新任务分解成一个个微小的工作单元（称为 Fiber）。它可以在执行几个工作单元后，暂停下来，将主线程控制权交还给浏览器，去响应用户输入或执行动画等更高优先级的任务，等浏览器空闲时再继续执行。

---

## React 内部架构的三大核心模块

我们可以将现代 React 架构拆解为三个主要部分：

1.  **Scheduler (调度器):** 决定**何时**执行任务。
2.  **Reconciler (协调器):** 决定**要做什么**任务 (找出变更)。
3.  **Renderer (渲染器):** **如何执行**任务 (将变更应用到宿主环境)。

---

## 1. Scheduler (调度器)

调度器的主要职责是管理任务的优先级，并决定在浏览器的哪个时间片执行这些任务。

*   **任务优先级:** React 将更新任务分为不同的优先级。例如：
    *   **同步/立即 (Synchronous/Immediate):** 最高优先级，必须立即执行，例如受控的用户输入。
    *   **用户阻塞 (User-Blocking):** 优先级高，例如用户点击按钮后触发的更新，需要尽快给用户反馈。
    *   **普通 (Normal):** 默认优先级，例如网络请求返回后的数据更新。
    *   **低优先级 (Low):** 可以被推迟的任务。
*   **时间切片 (Time Slicing):** Scheduler 的核心能力。它利用浏览器的 `requestIdleCallback` API (或其 polyfill)，在浏览器每一帧的空闲时间内执行 React 的更新任务。如果一个任务在一个时间片内（通常是几毫秒）没有完成，Scheduler 会暂停它，让浏览器去处理其他事情，然后在下一个空闲时间片继续。

---

## 2. Reconciler (协调器) - **Fiber 的核心**

这是 React 最核心、最复杂的部分。当 Scheduler 告诉 React 可以开始工作时，Reconciler 就开始计算需要进行的变更。

### 什么是 Fiber？

Fiber 不仅仅是一个虚拟 DOM 的概念，它是一个更强大的数据结构。**一个 Fiber 节点就是一个工作单元**。它本质上是一个 JavaScript 对象，包含了关于一个组件的所有信息：

* 组件的类型 (class, function, host component like `<div>`)
* 对应的 DOM 节点 (如果存在)
*   `props`, `state`
* 指向父节点、子节点、兄弟节点的指针 (`return`, `child`, `sibling`)，形成一个链表树结构。
* 更新的副作用标记 (`flags`)，例如 `Placement` (插入)、`Update` (更新)、`Deletion` (删除)。

### Fiber 树的双缓冲技术 (Double Buffering)

为了实现可中断更新，React 在内存中同时维护两棵 Fiber 树：

1.  **Current Tree (当前树):** 屏幕上已经渲染出来的 UI 对应的 Fiber 树。
2.  **Work-in-Progress Tree (工作树):** 正在后台构建的、代表了最新状态的 Fiber 树。

### Reconciler 的工作流程 (Render Phase)

这个阶段是**异步可中断**的。

1.  **开始更新:** 当调用 `setState` 或 `useState` 的更新函数时，一个更新任务被创建并交由 Scheduler 调度。
2.  **构建 Work-in-Progress Tree:** 当 Scheduler 开始执行任务时，Reconciler 会从触发更新的那个 Fiber 节点开始，基于 Current Tree “克隆”出一个 Work-in-Progress Tree。
3.  **Diffing 算法:** Reconciler 遍历这棵新的工作树，将新的 `props` 和 `state` 与旧的（Current Tree 上的）进行比较（这就是所谓的 "Diffing"）。
    * 如果组件类型或 `key` 没变，就复用旧节点，只标记需要更新 `props`。
    * 如果 `key` 变了或者组件类型变了，就标记旧节点为“删除”，并创建一个新节点。
    * 对于列表，通过 `key` 来高效地识别移动、新增和删除的元素。
4.  **收集副作用:** 在 Diffing 的过程中，Reconciler 会在每个需要改变的 Fiber 节点上打上一个“副作用”标记 (`flags`)，并将这些节点添加到一个 effect list (副作用列表) 中。

这个过程可以被 Scheduler 中断。如果更高优先级的任务来了，React 会扔掉当前的 Work-in-Progress Tree，等下次回来时从头开始重新构建。

---

## 3. Renderer (渲染器)

当 Reconciler 完成了所有的计算工作（即 Work-in-Progress Tree 构建完成），它会通知 Renderer 进入下一个阶段。

### 渲染器的工作流程 (Commit Phase)

这个阶段是**同步不可中断**的。

1.  **提交变更:** Renderer 拿到 Reconciler 生成的 effect list。
2.  **应用到宿主环境:** 它会一次性地、同步地遍历这个 effect list，并根据每个节点的副作用标记，执行相应的 DOM 操作（例如 `appendChild`, `removeChild`, `setAttribute` 等）。
3.  **生命周期/Hooks 调用:** 在这个阶段，也会同步调用 `componentDidMount`, `componentDidUpdate` 等生命周期方法，以及 `useEffect` 的清理函数和新 effect 函数。

为什么这个阶段必须同步？因为如果在应用 DOM 变更的过程中被中断，用户可能会看到一个只更新了一半的、不完整的 UI，这是不能接受的。

> **一句话总结 Renderer：** 像一个施工队，拿到建筑师最终确定的施工方案（effect list），然后迅速、一次性地把所有改造工作（DOM 操作）完成，让用户看到最终的建筑成果。

**这也是 React 能够跨平台的原因。** `react-dom` 是针对浏览器的渲染器，`react-native` 是针对原生 App 的渲染器。它们共享同样的 Scheduler 和 Reconciler，但 Renderer 的实现不同。

---

## 整个更新流程串讲

1.  **触发更新:** 用户操作调用了 `setState()`。
2.  **调度任务:** React 将这个更新任务添加到 Scheduler 中，Scheduler 根据其优先级安排执行时机。
3.  **进入 Render Phase (可中断):**
    *   Scheduler 在浏览器空闲时，开始执行 Reconciler 的工作。
    *   Reconciler 从根节点开始，构建 Work-in-Progress Fiber Tree。
    * 它一边构建，一边进行 Diff 比较，找出所有需要变化的节点，并为它们打上副作用标记，形成一个 effect list。
    * 这个过程可能会被更高优先级的任务（如新的用户输入）中断。
4.  **进入 Commit Phase (不可中断):**
    * 一旦 Work-in-Progress Tree 构建完成，Reconciler 就通知 Renderer 提交。
    *   Renderer 遍历 effect list，将所有变更一次性应用到 DOM 上。
    * 调用相关的生命周期方法和 `useEffect` Hooks。
    * 更新完成后，Work-in-Progress Tree 就变成了新的 Current Tree，等待下一次更新。


