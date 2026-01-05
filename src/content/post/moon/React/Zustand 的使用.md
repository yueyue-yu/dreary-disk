---
title: Zustand 的使用
description: ""
publishDate:  2025-12-30
tags:
  - Zustand
draft: false
---

## 1. 选择器引入 (Selectors) vs 对象结构引入 (Object Destructuring)

这是 Zustand 中**最重要**的性能优化点。

### 对象解构引入 (Bad for Performance)

当你直接调用 `useStore()` 时，你获取的是**整个 State 对象**。虽然你可以通过解构拿出你需要的值，但组件会订阅**整个 Store** 的变化。**Store 中任何一个属性变化（即使是你没用到的属性），都会导致该组件重新渲染。**

```javascript
// ❌ 不推荐
const { count } = useStore(); 
// 如果 store 里还有一个 'user' 字段变了，这个组件也会重新渲染！
```

### 选择器引入 (Good for Performance)

通过传入一个选择器函数 `(state) => state.prop`，组件只会订阅该函数的**返回值**。只有当返回值发生变化（默认使用 `===` 严格相等比较）时，组件才会重新渲染。

```javascript
// ✅ 推荐
const count = useStore((state) => state.count);
// 只有当 count 变化时，组件才会渲染。store 中其他字段变化互不影响。
```

---

## 2. 无 Store Actions 模式 (Separating Actions from State)

通常我们会把 `actions` (修改状态的方法) 写在 `create` 函数内部。但随着应用变大，Store 会变得臃肿。

**“无 Store Actions”模式**是指：只在 Store 里放数据，把 Actions 定义为外部的独立函数/模块。

### 传统模式

```javascript
const useStore = create((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })), // Action 耦合在 store 里
}));
```

### 无 Store Actions 模式 (推荐用于大型项目)

这样做的好处是 Actions 变成了纯粹的函数，更容易进行代码分割，且不需要通过 hook 获取。同时可以在任何非组件文件中调用 Action

```javascript
import { create } from 'zustand';

// 1. Store 只存数据
const useStore = create(() => ({
  count: 0,
  text: 'hello'
}));

// 2. Actions 定义在外部，直接操作 Store
export const inc = () => {
  // 使用 setState 直接修改
  useStore.setState((state) => ({ count: state.count + 1 }));
};

export const setText = (text) => {
  useStore.setState({ text });
};

// 组件中使用
// const count = useStore((s) => s.count);
// <button onClick={inc}>+1</button>
```

---

## 3. shallow 和 useShallow

默认情况下，Zustand 使用 `===` (严格相等) 来检测变化。如果你在选择器中返回了一个**新对象**或**新数组**，即使内容没变，React 也会认为它变了，导致无限重渲染或不必要的渲染。

### 场景：一次选择多个状态

如果你想一次拿多个值，通常会返回一个对象：

```javascript
// ⚠️ 危险：每次 store 变动，这个选择器都会返回一个新的对象引用 { a:..., b:... }
// 导致组件即使 a 和 b 没变也强制刷新
const { a, b } = useStore((state) => ({ a: state.a, b: state.b }));
```

### 解决方案：useShallow (Zustand v4.5+ / v5)

`useShallow` 是一个高阶 Hook，它会对返回的对象进行**浅比较**（比较对象的第一层属性值）。如果属性值没变，就不触发渲染。

```javascript
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow'; // 注意引入路径

const useStore = create((set) => ({ a: 1, b: 2, c: 3 }));

const Component = () => {
  // ✅ 安全：只有当 a 或 b 的值真正改变时，才会重渲染
  const { a, b } = useStore(
    useShallow((state) => ({ a: state.a, b: state.b }))
  );

  return <div>{a} + {b}</div>;
};
```

*注：旧版本的 `shallow` 比较函数作为 `useStore` 第二个参数的做法在 v5 中已被弃用，现在推荐使用 `useShallow` 钩子。*

---

## 4. combine 和 immer 的使用

### Combine (TypeScript 推断神器)

`combine` 是 Zustand 中间件的一种，主要用于 TypeScript 环境。它可以自动推断 State 的类型，你就不用手动写 interface 了。它将“初始状态对象”和“状态修改函数”结合起来。

```typescript
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

// combine(initialState, (set, get) => ({ actions... }))
const useStore = create(
  combine(
    { count: 0, name: 'Zustand' }, // 初始状态 (会自动推断类型)
    (set) => ({
      inc: () => set((state) => ({ count: state.count + 1 })),
      setName: (name: string) => set({ name }),
    })
  )
);
//此时 useStore 自动拥有 { count: number, name: string, inc: func, setName: func } 的类型
```

### Immer (简化深层更新)

Zustand 强调不可变更新（Immutable）。对于深层嵌套的对象，写 `...state` 很痛苦。`immer` 中间件允许你用“可变”的语法来写状态更新。

```javascript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const useStore = create(
  immer((set) => ({
    nested: { obj: { count: 0 } },
    
    inc: () =>
      set((state) => {
        // 直接修改，就像在 Vue 或普通 JS 里一样
        state.nested.obj.count += 1;
      }),
  }))
);
```

### Combine + Immer 混合使用

这两个可以组合使用，但要注意**中间件的顺序**。通常建议 `immer` 在最内层处理逻辑。

```typescript
import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

const useStore = create(
  // immer 包裹 combine 的第二个参数（函数部分）是不行的，
  // 通常需要手动组合或者使用 cast 类型，因为 combine 和 immer 的类型推断比较复杂。
  
  // 简单写法（不强求 combine，通常 immer 就够用了）：
  immer((set) => ({
      count: 0,
      inc: () => set((state) => { state.count++ })
  }))
);
```

*注意：在 TypeScript 中同时使用 `combine` 和 `immer` 可能会遇到类型推断的边缘情况，通常建议只用 `immer` 并手动定义类型接口，或者仅在简单场景使用 `combine`。*




## 5. `store.getState()`：组件外读取 / 无订阅

**核心场景：在纯 JS 函数中获取状态（如 API 请求）**

Hooks（如 `useStore`）只能在 React 组件内部使用。如果你在一个普通的 `.js` / `.ts` 文件里（例如 Axios 拦截器、工具函数、或者 Router 守卫）想要拿到 Store 里的数据，必须用 `getState()`。

```javascript
import { useAuthStore } from './store';

// 这是一个普通的 JS 函数，不是 React 组件
export const fetchUserData = async () => {
  
  // ❌ 错误：这里不能用 Hook，会报错
  // const token = useAuthStore(s => s.token); 

  // ✅ 正确：直接读取当前 Store 的快照
  const token = useAuthStore.getState().token;

  // 发起请求...
  return fetch('/api/user', { headers: { Authorization: token } });
};
```

**特点总结：**
*   **不订阅**：它只是读取一瞬间的值，Store 之后怎么变，跟这里没关系，也不会触发任何重渲染。
*   **随处可用**：只要能引入 `store`，就能读数据，不受 React 限制。