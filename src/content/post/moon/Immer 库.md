---
title: "Immer 库"
description: "介绍 Immer 的理念与使用：以可变写法生成不可变状态，结合 React Hooks 的实践（useImmer/useImmerReducer），并解析 Proxy 与写时复制的原理与最佳实践。"
publishDate: "2025-07-12"
tags: ["JavaScript", "Immer", "不可变", "React", "状态管理"]
draft: false
---
### 1. 什么是 Immer？
Immer 是一个用于处理不可变（Immutable）状态的小型库。它的核心思想是：**用你习惯的可变（Mutable）方式来编写代码，最终却能得到一个不可变的（Immutable）结果**。
Immer 提供了一个名为 `produce` 的函数，它接收你当前的状态（state）和一个“配方”（recipe）函数。在“配方”函数中，你可以像直接修改普通 JavaScript 对象或数组一样，对一个名为 `draft`（草稿）的对象进行任意修改。当函数执行完毕后，Immer 会根据你在 `draft` 上的操作，安全地生成一个新的、不可变的状态。
简单来说，Immer 让你告别了繁琐的展开运算符（`...`）和各种数组方法（`.map`, `.filter`）的嵌套，用最直观的方式来更新复杂的状态树。
---
### 2. 背景：为什么需要 Immer？
在 React 和 Redux 的世界里，**不可变性（Immutability）** 是一个核心原则。
**为什么强调不可变性？**
1. **性能优化**：React 可以通过浅比较（shallow comparison）来快速判断状态或 props 是否发生了变化（例如使用 `React.memo` 或 `PureComponent`）。如果状态是不可变的，那么当状态更新时，其引用地址一定会改变，React 就能轻松检测到变化并只重新渲染必要的组件。
2. **可预测性和调试**：状态的每次变化都会产生一个全新的对象，旧的状态得以保留。这使得追踪状态历史、实现撤销/重做功能以及使用时间旅行调试（Time-travel debugging）变得非常容易。
3. **避免副作用**：直接修改（mutate）原始状态可能会在应用的不同部分引发意想不到的副作用，导致难以追踪的 bug。
**不可变性的痛点是什么？**
虽然不可变性好处多多，但在实践中，手动维护它却非常痛苦，尤其是当状态结构很深时。
**传统方式（不使用 Immer）：**
假设我们有这样一个嵌套很深的状态：
```JavaScript
const state = {
  user: {
    name: 'Alice',
    details: {
      address: {
        city: 'New York',
        zip: '10001'
      },
      hobbies: ['reading', 'coding']
    }
  },
  posts: [/* ... */]
};
```
现在，我们想把城市（city）改成 "San Francisco"。用传统方式，代码会是这样：
```JavaScript
const newState = {
  ...state, // 1. 复制顶层
  user: {
    ...state.user, // 2. 复制 user
    details: {
      ...state.user.details, // 3. 复制 details
      address: {
        ...state.user.details.address, // 4. 复制 address
        city: 'San Francisco' // 5. 最后更新值
      }
    }
  }
};
```
这段代码非常冗长、易错，并且难以阅读。如果忘记复制任何一层，就会意外地修改原始状态，破坏不可变性原则。
**Immer 的出现正是为了解决这个痛点。**
---
### 3. Immer 的核心使用方法
Immer 的主要 API 就是 `produce` 函数。
### 基础用法
`produce` 函数接收两个参数：
- `baseState`：原始的、不可变的状态。
- `recipe` (配方函数)：一个函数，它接收一个 `draft` (草稿) 作为参数。你可以在这个函数内部“直接修改”`draft`。
```JavaScript
import { produce } from 'immer';
// 使用上面的 state
const newState = produce(state, draft => {
  // 在这里，你可以像修改普通对象一样操作 draft
  draft.user.details.address.city = 'San Francisco';
  draft.user.details.hobbies.push('hiking'); // 也可以操作数组
});
// `state` 本身完全没有被改变
console.log(state.user.details.address.city); // "New York"
// `newState` 是一个全新的对象，包含了我们的修改
console.log(newState.user.details.address.city); // "San Francisco"
```
看，代码是不是变得极其简洁和直观了？你只需要关心你要修改什么，而不用操心如何一层层地去复制。
### 在 React Hooks 中的应用
Immer 与 React Hooks (`useState`, `useReducer`) 结合使用非常方便。官方提供了 `use-immer` 这个包来进一步简化操作。
**1. 搭配** `**useState**` **(使用** `**useImmer**`**)**
首先安装 `use-immer`：  
`npm install use-immer` 或 `yarn add use-immer`
```JavaScript
import { useImmer } from 'use-immer';
function Profile() {
  const [user, setUser] = useImmer({
    name: 'Alice',
    details: {
      address: {
        city: 'New York',
        zip: '10001'
      }
    }
  });
  function updateCity(newCity) {
    // setUser 的用法和 Immer 的 recipe 函数一样
    setUser(draft => {
      draft.details.address.city = newCity;
    });
  }
  return (
    <div>
      <h1>{user.name} lives in {user.details.address.city}</h1>
      <button onClick={() => updateCity('San Francisco')}>Move to SF</button>
    </div>
  );
}
```
`setUser` 函数接收一个 recipe，你可以直接在里面修改 `draft`，`useImmer` 会自动处理状态更新。
**2. 搭配** `**useReducer**` **(使用** `**useImmerReducer**`**)**
```JavaScript
import { useImmerReducer } from 'use-immer';
const initialState = { count: 0, user: { name: 'Bob' } };
function reducer(draft, action) {
  switch (action.type) {
    case 'increment':
      draft.count++;
      return; // 在 Immer reducer 中，可以直接修改 draft 并返回 undefined
    case 'decrement':
      draft.count--;
      return;
    case 'changeName':
      draft.user.name = action.payload;
      return;
    default:
      return;
  }
}
function Counter() {
  const [state, dispatch] = useImmerReducer(reducer, initialState);
  return (
    <>
      Count: {state.count}
      <br/>
      Name: {state.user.name}
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'changeName', payload: 'Charlie' })}>
        Change Name
      </button>
    </>
  );
}
```
在 `useImmerReducer` 中，你的 reducer 函数接收的是 `draft` 状态，而不是普通状态。这使得 reducer 的逻辑变得异常清晰，不再需要 `switch` 语句中充斥着大量的展开运算符。
---
### 4. Immer 的工作原理
Immer 的魔法背后是 **ES6 Proxy** 和 **写时复制（Copy-on-write）** 机制。
1. **创建代理 (Proxy)**：当你调用 `produce(state, recipe)` 时，Immer 并不会立即完整地克隆你的 `state`。相反，它会创建一个 `Proxy` 对象来包裹你的 `state`，这个 `Proxy` 就是你拿到的 `draft`。
2. **拦截操作**：
    - **读取操作**：当你读取 `draft` 的某个属性时（如 `draft.user.name`），`Proxy` 会将这个操作转发到原始的 `state` 上，并返回相应的值。这个过程不会产生任何开销或复制。
    - **写入操作**：当你尝试修改 `draft` 的某个属性时（如 `draft.user.details.address.city = 'SF'`），`Proxy` 会拦截这个写入操作。这时，**写时复制** 机制被触发。
3. **写时复制 (Copy-on-write)**：
    - Immer 会检查被修改的节点（`address` 对象）。如果这个节点还没有被复制过，它会创建一个该节点的浅拷贝。
    - 然后，这个修改操作会应用到这个新创建的拷贝上。
    - 这个过程会沿着状态树向上冒泡。也就是说，`details` 对象也会被复制以包含新的 `address` 对象，`user` 对象也会被复制以包含新的 `details` 对象，直到根节点。
4. **生成最终状态**：当你的 `recipe` 函数执行完毕后，Immer 会用这些新创建的、被修改过的节点，与原始 `state` 中未被触及的部分组合起来，生成最终的 `nextState`。
**关键点**：只有你**修改过**的路径上的节点才会被复制。所有未被触及的部分，在 `nextState` 和 `state` 中仍然是同一个引用（`===`）。这正是 React 性能优化所依赖的特性。
---
### 5. 注意事项和最佳实践
1. **不要在 recipe 中既修改** `**draft**` **又** `**return**` **新状态**
    - Immer 允许你在 recipe 中返回一个全新的值来完全替换状态。但如果你这样做了，就**不要**再修改 `draft`。
    - **推荐做法**：只修改 `draft`，并且不 `return` 任何东西（或者 `return undefined`）。
    - **错误示例**:
        
        ```JavaScript
        // 错误！不要这样做
        produce(state, draft => {
          draft.a = 1; // 修改了 draft
          return { a: 1 }; // 又返回了新对象
        })
        ```
        
2. **Recipe 函数必须是纯函数**
    - 不要在 recipe 函数中执行任何副作用，比如发起 API 请求、`setTimeout`、修改外部变量等。它只应该用于基于当前状态和输入来生成新状态。
3. **不要将** `**draft**` **对象泄露到 recipe 函数外部**
    - `draft` 是一个特殊的 `Proxy` 对象，它在 `produce` 函数执行完毕后就会被“吊销”(revoked)，变得不可用。不要在 `console.log` 中打印它（会显示复杂的 Proxy 细节），也不要将它存到变量中供以后使用。
4. **异步操作**
    - Recipe 函数本身必须是同步的。如果你需要处理异步逻辑，应该在调用 `produce` 之前完成。
    - **正确模式**：
        
        ```JavaScript
        async function myAsyncUpdate() {
          const data = await fetchApi(); // 1. 先执行异步操作
          // 2. 在异步操作完成后，再用其结果同步地更新状态
          setState(produce(draft => {
            draft.data = data;
          }));
        }
        ```
        
5. **性能考量**
    - 对于绝大多数应用场景，Immer 的性能开销可以忽略不计。`Proxy` 的性能非常出色。
    - 只有在极少数需要进行海量、高频次更新的场景下（例如，每秒更新几千次大型对象），你才可能需要考虑其性能影响。对于常规的 Web 应用，它带来的开发效率提升远大于其微小的性能开销。
---
### 总结
Immer 是一个优雅而强大的工具，它完美地解决了 JavaScript 中不可变性操作的复杂性问题。
- **优点**：
    - **代码简洁**：用直观的可变方式编写代码。
    - **减少错误**：从根本上避免了忘记展开运算符导致的 bug。
    - **易于上手**：学习成本极低，符合直觉。
    - **性能优秀**：通过写时复制和代理机制，兼顾了性能和开发体验。
- **适用场景**：
    - React `useState` 和 `useReducer` 的状态管理。
    - Redux 和 Redux Toolkit（Redux Toolkit 内部已经深度集成了 Immer）。
    - 任何需要进行不可变数据操作的 JavaScript 环境。
如果你还在为管理复杂的 React 状态而烦恼，强烈推荐你尝试使用 Immer，它会极大地提升你的开发幸福感。
---
