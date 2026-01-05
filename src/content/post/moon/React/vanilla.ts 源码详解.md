---
title: vanilla.ts 源码详解
description: ""
publishDate:  2025-12-30
tags: []
draft: false
---

---

## 📋 文件概览



**文件位置**: `src/vanilla.ts`

**代码行数**: ~110 行

**核心功能**: 创建和管理状态 store

**依赖**: 无（纯 TypeScript）

---

## 🎯 核心概念



### 1. StoreApi - Store 的基本接口

```typescript

export interface StoreApi<T> {

setState: SetStateInternal<T>

getState: () => T

getInitialState: () => T

subscribe: (listener: (state: T, prevState: T) => void) => () => void

}

```

**四个核心方法**:

- `setState`: 更新状态

- `getState`: 获取当前状态

- `getInitialState`: 获取初始状态

- `subscribe`: 订阅状态变化

---

## 🔧 类型系统详解



### SetStateInternal - setState 的类型定义

```typescript
type SetStateInternal<T> = {
  // 重载 1: 合并/部分更新
  _(
    partial: T | Partial<T> | { _(state: T): T | Partial<T> }['_'],
    replace?: false,
  ): void;

  // 重载 2: 完全替换
  _(
    state: T | { _(state: T): T }['_'],
    replace: true,
  ): void;
}['_'];
```



**设计巧思**:

- 使用对象索引访问 `['_']` 来定义函数重载

- 支持两种模式：

1. **部分更新** (`replace?: false`) - 默认模式，合并状态

2. **完全替换** (`replace: true`) - 替换整个状态

  

**使用示例**:

```typescript

// 部分更新
setState({ count: 1 })
setState(state => ({ count: state.count + 1 }))
// 完全替换
setState({ count: 0, name: 'new' }, true)

```

---

### StateCreator - 状态创建函数类型

```typescript

// StateCreator: 状态创建函数类型，接收 setState、getState、store 三个参数

// 用户创建 store 时传入的函数就是这个类型

export type StateCreator<

T,

Mis extends [StoreMutatorIdentifier, unknown][] = [],

Mos extends [StoreMutatorIdentifier, unknown][] = [],

U = T,

> = ((

setState: Get<Mutate<StoreApi<T>, Mis>, 'setState', never>,

getState: Get<Mutate<StoreApi<T>, Mis>, 'getState', never>,

store: Mutate<StoreApi<T>, Mis>,

) => U) & { $$storeMutators?: Mos }

```

**类型参数**:

- `T`: 状态类型

- `Mis`: Middlewares In - 输入中间件数组

- `Mos`: Middlewares Out - 输出中间件数组

- `U`: 返回类型，默认为 T

**作用**:

定义创建 store 状态的函数，该函数接收 `setState`、`getState`、`store` 三个参数。

---

### Mutate - 中间件类型转换器

```typescript

export type Mutate<S, Ms> = number extends Ms['length' & keyof Ms]

? S

: Ms extends []

? S

: Ms extends [[infer Mi, infer Ma], ...infer Mrs]

? Mutate<StoreMutators<S, Ma>[Mi & StoreMutatorIdentifier], Mrs>

: never

```

**工作原理** (递归类型):

1. 如果 `Ms` 长度不确定 → 返回原类型 `S`

2. 如果 `Ms` 是空数组 → 返回原类型 `S`

3. 否则 → 取出第一个中间件应用变换，递归处理剩余中间件

  

**示例**:

```typescript

// 没有中间件

Mutate<StoreApi<T>, []> = StoreApi<T>

  

// 一个中间件

Mutate<StoreApi<T>, [['persist', PersistOptions]]>

= StoreMutators<StoreApi<T>, PersistOptions>['persist']

  

// 多个中间件（递归应用）

Mutate<StoreApi<T>, [['devtools', ...], ['persist', ...]]>

```

---

## 💡 createStoreImpl 函数详解



这是 Zustand 的**心脏**！



### 整体结构

```typescript

const createStoreImpl: CreateStoreImpl = (createState) => {

// 1. 类型定义

type TState = ReturnType<typeof createState>

type Listener = (state: TState, prevState: TState) => void

// 2. 状态和订阅者（闭包变量）

let state: TState

const listeners: Set<Listener> = new Set()

  

// 3. 核心方法

const setState = (partial, replace) => { /* ... */ }

const getState = () => state

const getInitialState = () => initialState

const subscribe = (listener) => { /* ... */ }

  

// 4. 初始化并返回 API

const api = { setState, getState, getInitialState, subscribe }

const initialState = (state = createState(setState, getState, api))

return api as any

}

```

---

### setState 实现详解

```typescript

const setState: StoreApi<TState>['setState'] = (partial, replace) => {

// 步骤1: 计算新状态

const nextState =

typeof partial === 'function'

? (partial as (state: TState) => TState)(state)

: partial

// 步骤2: 检查状态是否真的改变

if (!Object.is(nextState, state)) {

const previousState = state

// 步骤3: 决定合并还是替换

state =

(replace ?? (typeof nextState !== 'object' || nextState === null))

? (nextState as TState) // 完全替换

: Object.assign({}, state, nextState) // 浅合并

// 步骤4: 通知所有订阅者

listeners.forEach((listener) => listener(state, previousState))

}

}

```

#### 关键设计点



**1. 支持函数式更新**

```typescript

// 直接设置

setState({ count: 1 })

  

// 函数式更新（基于当前状态）

setState(state => ({ count: state.count + 1 }))

```

**2. Object.is 性能优化**

```typescript

if (!Object.is(nextState, state)) {

// 只在状态真正改变时才更新

}

```

为什么用 `Object.is` 而不是 `===`？

- `Object.is(NaN, NaN)` → `true` （`===` 是 `false`）

- `Object.is(+0, -0)` → `false` （`===` 是 `true`）

  

**3. 合并 vs 替换逻辑**

```typescript

state = (replace ?? (typeof nextState !== 'object' || nextState === null))

? (nextState as TState) // 完全替换

: Object.assign({}, state, nextState) // 浅合并

```

**替换条件**（满足任一即替换）:

- `replace` 显式为 `true`

- `nextState` 不是对象（如 number, string）

- `nextState` 是 `null`

  

**4. 通知订阅者**

```typescript

listeners.forEach((listener) => listener(state, previousState))

```

遍历所有订阅者，传入新状态和旧状态。

---

### subscribe 实现详解

```typescript

const subscribe: StoreApi<TState>['subscribe'] = (listener) => {

listeners.add(listener)

return () => listeners.delete(listener) // 返回取消订阅函数

}

```

**订阅模式**:

```typescript

const unsubscribe = store.subscribe((state, prevState) => {

console.log('状态从', prevState, '变为', state)

})

  

// 取消订阅

unsubscribe()

```

**为什么用 Set？**

- 自动去重（同一个 listener 不会被添加两次）

- O(1) 添加和删除操作

- 便于遍历

---

### 初始化流程

```typescript

const api = { setState, getState, getInitialState, subscribe }

const initialState = (state = createState(setState, getState, api))

return api as any

```

**执行顺序**:

1. 组装 API 对象

2. 调用 `createState(setState, getState, api)` 创建初始状态

3. 同时将结果赋值给 `state` 和 `initialState`

4. 返回 API 对象

  

**注意**: `state = createState(...)` 使用了赋值表达式，所以 `initialState` 和 `state` 指向同一个值。

---

## 🚀 createStore 函数

```typescript

export const createStore = ((createState) =>

createState ? createStoreImpl(createState) : createStoreImpl) as CreateStore

```

**巧妙设计**:

- 如果传入参数 → 调用 `createStoreImpl(createState)`

- 如果没传参数 → 返回 `createStoreImpl` 本身

  

**支持两种调用方式**:

```typescript

// 方式1: 直接调用

const store = createStore((set) => ({

count: 0,

increment: () => set(state => ({ count: state.count + 1 }))

}))

  

// 方式2: 柯里化（用于显式类型）

interface MyState {

count: number

increment: () => void

}

  

const store = createStore<MyState>()((set) => ({

count: 0,

increment: () => set(state => ({ count: state.count + 1 }))

}))

```

---

## 🎨 设计模式分析



### 1. 闭包模式

```typescript

let state: TState

const listeners: Set<Listener> = new Set()

```

使用闭包保存私有状态，外部无法直接访问，只能通过 API 方法操作。



**优点**:

- 封装性好

- 避免全局污染

- 天然的私有变量

---

### 2. 观察者模式

```typescript

const listeners: Set<Listener> = new Set()

  

const subscribe = (listener) => {

listeners.add(listener)

return () => listeners.delete(listener)

}

  

const setState = (...) => {

// ...

listeners.forEach((listener) => listener(state, previousState))

}

```

**角色**:

- **主题（Subject）**: Store

- **观察者（Observer）**: Listener 函数

- **订阅**: `subscribe` 方法

- **通知**: `setState` 中的 `forEach` 调用

---

### 3. 工厂模式

```typescript

const createStoreImpl = (createState) => {

// 创建并返回 store API

return { setState, getState, getInitialState, subscribe }

}

```

每次调用都创建一个新的独立 store。

---

## 📊 数据流图

```

用户代码

↓

createStore(stateCreator)

↓

createStoreImpl 执行

↓

创建闭包变量: state, listeners

↓

创建方法: setState, getState, subscribe

↓

执行 stateCreator(setState, getState, api)

↓

初始化 state 和 initialState

↓

返回 API 对象

↓

用户调用 setState

↓

计算新状态 → 更新 state → 通知 listeners

↓

组件重新渲染

```

---

## 🧪 使用示例



### 基础示例

```typescript

import { createStore } from 'zustand/vanilla'

  

// 创建 store

const store = createStore((set) => ({

count: 0,

increment: () => set((state) => ({ count: state.count + 1 })),

decrement: () => set((state) => ({ count: state.count - 1 })),

reset: () => set({ count: 0 }),

}))

  

// 获取状态

console.log(store.getState().count) // 0

  

// 订阅变化

const unsubscribe = store.subscribe((state, prevState) => {

console.log('count 从', prevState.count, '变为', state.count)

})

  

// 更新状态

store.getState().increment() // count 从 0 变为 1

store.getState().increment() // count 从 1 变为 2

  

// 取消订阅

unsubscribe()

```

---

### 高级示例 - 异步操作

```typescript

const store = createStore((set, get) => ({

data: null,

loading: false,

error: null,

fetchData: async () => {

set({ loading: true, error: null })

try {

const response = await fetch('/api/data')

const data = await response.json()

set({ data, loading: false })

} catch (error) {

set({ error: error.message, loading: false })

}

},

}))

```

---

