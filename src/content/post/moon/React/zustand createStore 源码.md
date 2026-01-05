---
title: zustand createStore 源码
description: ""
publishDate: 2025-12-30
tags:
  - Zustand
draft: false
---


## 1. 场景设定：你写了一个简单的 Store

假设你在业务代码里写了这样一行代码：

```javascript
// 这是传给 createStoreImpl 的参数，也就是代码中的 `createState`
const myUserFunc = (set, get) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 }))
});

// 调用核心函数
const store = createStoreImpl(myUserFunc);
```

## 2. 逐行“慢动作”回放

现在我们看 `createStoreImpl` 内部发生了什么，特别是它是如何处理你的 `myUserFunc` 的。

### 第一阶段：准备工作（闭包环境）

```javascript
// 1. 接收参数
const createStoreImpl = (createState) => {
  // 此时，createState 就是你的 myUserFunc

  // 2. 准备容器（闭包）
  // 这些变量会一直存在内存里，因为被下面的函数引用了
  let state;             // 目前是 undefined
  const listeners = new Set(); 
```

### 第二阶段：制造工具（定义方法）

```javascript
  // 3. 制造修改器 setState
  const setState = (partial, replace) => {
    // ... 具体逻辑稍后再看，先知道它被造出来了 ...
  }

  // 4. 制造查看器 getState
  const getState = () => state; // 此时 state 还是 undefined

  // 5. 组装 API 对象
  const api = { setState, getState, ... };
```

### 第三阶段：最关键的一步（初始化与依赖注入）

请死死盯着代码倒数第二行：

```javascript
  // 6. 执行你的函数！
  // 这一行发生了神奇的“依赖注入”
  const initialState = (state = createState(setState, getState, api));
```

这里发生了三件事：

1.  **调用 `createState`**：Zustand 调用了你写的 `myUserFunc`。
2.  **传参**：它把刚才造好的 `setState`（锤子）、`getState`（眼镜）和 `api` 按照顺序塞给了你的函数。
    * 这就是为什么你的函数里能用 `set` 和 `get`，因为是库在这一刻传给你的！
3.  **赋值**：你的函数运行完毕，返回了 `{ count: 0, inc: ... }`。
    * 这个返回值被赋给了闭包变量 `state`。
    *   **从此，Store 初始化完成了！** `state` 变成了 `{ count: 0, ... }`。

### 第四阶段：交货

```javascript
  // 7. 返回 API
  return api;
}
```

你拿到的 `store` 变量，就是这个 `api` 对象。

---

## 3. 当你调用 `store.setState` 时发生了什么？

现在 Store 建立好了。我们在外面调用一下：

```javascript
// 你的业务代码
store.setState({ count: 5 });
```

让我们回到 `createStoreImpl` 里的 `setState` 实现看看：

```javascript
const setState = (partial, replace) => {
  // partial 就是 { count: 5 }
  
  // 1. 这里的 state 是闭包里的旧值 { count: 0 }
  
  // 2. 计算新状态 nextState
  // 因为你传的不是函数，所以 nextState = { count: 5 }
  const nextState = typeof partial === 'function' ? ... : partial;

  // 3. 检查是否变化 (Object.is)
  if (!Object.is(nextState, state)) {
    const previousState = state; // 存一下旧值

    // 4. 真正修改状态
    // 如果 replace 是 false (默认)，执行合并：
    // Object.assign({}, {count:0}, {count:5}) -> 得到新对象 {count:5}
    state = (replace ?? ...) 
      ? ... 
      : Object.assign({}, state, nextState);
    
    // 此时，闭包里的 state 已经更新了！
    
    // 5. 通知组件更新
    listeners.forEach((listener) => listener(state, previousState));
  }
}
```

## 4. 总结

这段代码最精妙的地方在于**倒数第二行**：

```javascript
state = createState(setState, getState, api)
```

* 它利用**高阶函数**的思想。
* 它**先**定义了“改变状态的方法”(`setState`)。
*   **然后**才去调用你的初始化函数，把这个方法传给你。
* 最后拿到你的初始值存起来。

这就是为什么你在写 Zustand 时，明明还没拿到 store，却可以在函数里写 `set(...)` ——因为你是**定义**操作，而 Zustand 在**初始化**时把操作权柄（set）交到了你手上。