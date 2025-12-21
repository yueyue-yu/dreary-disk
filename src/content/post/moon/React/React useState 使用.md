---
title: React useState 使用
description: 梳理 useState 的渲染触发与 Object.is 比较规则、React 18 自动批处理、闭包陷阱与函数式更新、不可变性、Hooks 规则及惰性初始化。
publishDate:  2025-09-11
tags:
  - React
draft: false
---

---

## 问题一：状态更新的“延迟”与批量处理
**表现**：连续多次调用 `setState`，或者在调用后立即打印 state，未能获取最新值。

### 1. 现象复现

```javascript
const [count, setCount] = useState(0);

const handleBatch = () => {
  setCount(count + 1);
  setCount(count + 1);
  setCount(count + 1);
  console.log(count); // 输出 0，而非更新后的值
};
// 渲染结果：count 仅增加 1，而非 3
```

### 2. 原理剖析：Update Queue 与 Batching 策略

#### 调度（Scheduling）而非立即执行
调用 `setCount` 并不等同于赋值操作 `count = 1`。在 React 源码层面，它触发了一次 `dispatchAction`。
*   **Action 创建**：React 会创建一个 Update 对象（包含 lane 优先级、payload 等信息）。
*   **入队**：该 Update 对象被推入当前 Fiber 节点的 **Update Queue（更新队列）**。
*   **调度**：React 调度器（Scheduler）标记该组件为“脏（Dirty）”，并安排在未来的某个微任务或宏任务中执行 Render 阶段。

#### 自动批处理（Automatic Batching）
React 18 引入了自动批处理机制。在同一个 **Tick（事件循环周期）** 内触发的所有状态更新，会被合并处理。
* 在上述代码执行过程中，React 并未立即触发重渲染。
* 三次 `setCount(count + 1)` 实际上向队列中推入了三个相同的 Update 请求（假设当前 `count` 为 0，则三个请求 payload 均为 1）。
* 当事件处理函数执行完毕，React 处理队列时，最终计算结果为 1。

#### 闭包（Closure）的限制
`console.log(count)` 输出 0 的原因在于 JavaScript 的词法作用域。
*   **快照模型**：当前渲染帧是一个独立的函数执行上下文，`count` 是该上下文中的常量（`const`）。
* 无论 `setState` 是否同步执行，当前作用域内的 `count` 变量已经被**捕获**，其值不可改变。

### 3. 技术解法
*   **函数式更新**：`setCount(prev => prev + 1)`。这会在队列中创建一个带有**回调函数**的 Update。React 在处理队列时，会将前一个 Update 的计算结果作为参数传递给下一个 Update，从而实现链式计算。

---

## 问题二：对象/数组修改无效（渲染跳过）
**表现**：直接修改 state 中的对象属性，组件未触发 Re-render。

### 1. 现象复现

```javascript
const [state, setState] = useState({ value: 1 });

const mutate = () => {
  state.value = 2; // 直接修改内存
  setState(state); // 传入相同的引用
};
```

### 2. 原理剖析：Referential Equality 与 Bailout 路径

#### 协调阶段（Reconciliation）的优化
React 的渲染过程分为 Render 阶段和 Commit 阶段。在 Render 阶段，React 会决定哪些组件需要更新。

*   **Eager State Check**：在调用 `dispatchAction` 时，React 会预先检查新值与当前存储的 `memoizedState` 是否相等。
*   **Object.is 算法**：React 使用 `Object.is(oldState, newState)` 进行浅比较。
*   **Bailout 策略**：如果 `Object.is` 返回 `true`，React 认为数据未发生变化，直接复用当前的 Fiber 节点，**跳过（Bailout）** 后续的 Diff 和 Render 过程。

#### 引用数据类型的问题
在上述代码中，`state.value = 2` 修改了堆内存中的数据，但 `state` 变量在栈内存中的**引用地址**未变。
*   `Object.is(state, state)` 结果为 `true`。
*   React 命中 Bailout 策略，视图不更新。

### 3. 技术解法
*   **不可变数据（Immutability）**：强制创建新的内存引用。

    ```javascript
    setState({ ...state, value: 2 }); // 创建新对象，引用地址变更
    ```

---

## 问题三：Hooks 调用顺序错误（Invariant Violation）
**表现**：在条件语句（`if`）或循环中使用 `useState`，导致 React 抛出异常或状态混乱。

### 1. 现象复现

```javascript
let isMounted = true;
function Component() {
  if (isMounted) {
     const [a] = useState(1);
  }
  const [b] = useState(2); 
}
```

### 2. 原理剖析：Fiber 链表结构（Linked List）

#### 无 Key 的存储机制
与 Vue 或 MobX 基于响应式代理不同，React Hooks 的底层存储不依赖变量名，而是严格依赖**调用顺序**。

*   **Fiber.memoizedState**：在 React Fiber 节点上，所有的 Hooks 状态被存储在一个**单向链表**中。

    ```typescript
    // 伪代码结构
    FiberNode.memoizedState = {
      memoizedState: value_A, // 第一个 Hook 的值
      next: {
        memoizedState: value_B, // 第二个 Hook 的值
        next: null
      }
    }
    ```

*   **游标（Cursor）匹配**：每次组件重新渲染时，React 内部维护一个全局游标（workInProgressHook）。
    * 第一次调用 `useState`，读取链表第 1 个节点。
    * 第二次调用 `useState`，读取链表第 2 个节点。

#### 链表错位
如果 `if (isMounted)` 导致第一次调用被跳过：
* 代码中的 `const [b] = useState(2)` 会错误地读取到链表中的第 1 个节点（本该属于 `a` 的状态）。
* 这种错位会导致状态类型不匹配，甚至引发 React 内部断言错误（Invariant Violation），导致应用崩溃。

---

## 问题四：昂贵的初始化计算（性能损耗）
**表现**：将复杂计算直接作为 `useState` 的参数，导致每次渲染都执行该计算逻辑。

### 1. 现象复现

```javascript
function heavyComputation() {
  // 假设耗时 100ms
  return localStorage.getItem('large_data');
}

const Component = () => {
  // 每次 Render 都会执行 heavyComputation()
  const [data] = useState(heavyComputation());
  return <div>...</div>;
};
```

### 2. 原理剖析：JS 执行流与惰性初始化（Lazy Initialization）

#### JavaScript 的求值策略
在 JavaScript 中，函数参数是**按值传递**的。在调用 `useState(getValue())` 之前，JS 引擎必须先执行 `getValue()` 以获取参数值。
* 这意味着：**每一次**组件函数重新执行（Re-render），`heavyComputation` 都会被同步执行。
* 虽然 React 内部只在 Mount 阶段使用该初始值，在 Update 阶段会忽略它，但这部分 JS 计算资源的浪费是已经发生了的。

#### 惰性初始化
React 允许 `useState` 接收一个函数作为参数。

```javascript
const [data] = useState(() => heavyComputation());
```

*   **Mount 阶段**：React 检测到参数是函数，会调用该函数并将返回值作为初始状态。
*   **Update 阶段**：React 仅仅返回当前的 `state`，**完全不调用**传入的初始化函数。

---

## 技术总结

| 核心问题            | 底层技术原理                                     | 最佳实践                                                 |
| :-------------- | :----------------------------------------- | :--------------------------------------------------- |
| **状态非实时更新**     | **Batching & Scheduling**：更新进入队列，异步调度执行。   | 依赖旧值时使用**函数式更新** `set(prev => ...)`。                 |
| **获取到旧值**       | **Stale Closure**：函数组件是快照，变量在闭包中不可变。       | 使用 `useEffect` 监听依赖，或利用 `useRef` 穿透闭包。               |
| **UI 不刷新**      | **Object.is & Bailout**：浅比较引用，相同则跳过渲染。     | 遵循 **Immutability** 原则，永远创建新对象引用。                    |
| **Hooks 报错/错乱** | **Fiber Linked List**：依赖链表顺序存储状态，无 Key 映射。 | 严格遵守 Hooks 规则，**只在顶层**调用。                            |
| **初始化卡顿**       | **JS Evaluation**：参数先行计算。                  | 使用 **Lazy Initialization** `useState(() => init())`。 |