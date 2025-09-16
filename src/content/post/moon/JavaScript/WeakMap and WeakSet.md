---
title: WeakMap and WeakSet
description: ""
publishDate: 2025-09-16
tags:
  - JavaScript
draft: false
---



## 什么是垃圾回收器和“强引用”？

在 JavaScript 中，你不需要手动管理内存。一个名为 **垃圾回收器（Garbage Collector, GC）** 的引擎进程会周期性地运行，并释放那些从应用的根（root）“无法访问”或“无法触达”的对象所占用的内存。

一个标准的变量、`Map` 或 `Set` 会创建一个对对象的 **强引用**。这意味着只要这个引用存在，该对象就 **不能** 被垃圾回收。

```javascript
let myObject = { name: "我是一个对象" };

// 在 Map 中创建一个强引用
let myMap = new Map();
myMap.set(myObject, "一些元数据");

// 现在，即使我们丢失了原始的引用...
myObject = null;

// ...这个对象仍然存在于内存中，因为 `myMap` 持有对它的强引用。
// 只要 `myMap` 没有被清空或销毁，这个对象就不会被回收。
// 如果不小心管理，这可能会导致内存泄漏。
```

`WeakMap` 和 `WeakSet` 通过使用 **弱引用** 解决了这个问题。

---

## WeakMap

`WeakMap` 是一种键值对的集合，其中 **键是对象** 并且是 **被弱引用** 的。

### 核心特性：

1.  **键必须是对象**：你不能使用原始值（如字符串、数字或布尔值）作为键。它的整个目的就是为了跟踪一个对象的生命周期。
2.  **对键的弱引用**：这是最重要的特性。如果一个在 `WeakMap` 中用作键的对象，在你的程序中没有其他任何 **强** 引用指向它，垃圾回收器就可以回收这个对象。当键被回收时，对应的键值对会 **自动从 `WeakMap` 中移除**。
3.  **不可迭代**：你不能使用 `forEach`、`for...of` 循环来遍历 `WeakMap`，也无法获取其键或值的列表。它没有 `size` 属性，也没有 `.keys()`、`.values()` 或 `.entries()` 方法。
    *   **为什么？** 因为垃圾回收器可能在任何时候移除其中的条目，所以其大小是不可预测的，遍历它也是不可靠的。

### 可用方法：

*   `set(key, value)`: 添加一个新的键值对。
*   `get(key)`: 返回与键关联的值。
*   `has(key)`: 如果键存在，则返回 `true`。
*   `delete(key)`: 移除一个键值对。

### 示例：

```javascript
let user = { id: 1, name: "张三" };

// 创建一个 WeakMap 来存储关于用户的额外、非必要的数据。
const userMetadata = new WeakMap();
userMetadata.set(user, { lastLogin: Date.now() });

console.log(userMetadata.get(user)); // { lastLogin: 167... }
console.log(userMetadata.has(user)); // true

// 现在，假设用户登出，我们移除了所有对 'user' 对象的强引用。
user = null;

// 此时，再也没有强引用指向最初的 { id: 1, ... } 对象了。
// 下一次垃圾回收器运行时，它就可以自由地销毁该对象。
// 当对象被销毁时，它在 `userMetadata` 中的条目也会自动消失，从而防止了内存泄漏。
// 你无法可靠地测试这具体*何时*发生；它是由 JS 引擎管理的。
```

## WeakSet

`WeakSet` 是一个 **对象** 的集合，这些对象是被 **弱引用** 的。你可以把它看作是 `Set` 的“弱”版本。

### 核心特性：

1.  **值必须是对象**：与 `WeakMap` 的键一样，你只能在 `WeakSet` 中存储对象。
2.  **对值的弱引用**：如果存储在 `WeakSet` 中的一个对象没有其他强引用，垃圾回收器就可以回收它，并且它会自动从 `WeakSet` 中被移除。
3.  **不可迭代**：出于与 `WeakMap` 相同的原因，你不能遍历 `WeakSet`。它没有 `size` 属性或迭代方法。

### 可用方法：

*   `add(value)`: 向集合中添加一个对象。
*   `has(value)`: 如果对象在集合中，则返回 `true`。
*   `delete(value)`: 从集合中移除一个对象。

### 示例：

```javascript
// 让我们用 WeakSet 来跟踪当前哪些用户处于登录状态。
const loggedInUsers = new WeakSet();

let user1 = { name: "Alice" };
let user2 = { name: "Bob" };

loggedInUsers.add(user1);
loggedInUsers.add(user2);

console.log(loggedInUsers.has(user1)); // true

// Alice 登出了。我们移除了对她对象的强引用。
user1 = null;

// 下一次垃圾回收器运行时，'Alice' 对象将被从内存中移除，
// 同时也会自动从 `loggedInUsers` 这个 WeakSet 中移除。
// 我们不需要手动清理这个集合。
```

---

## 实际应用场景

### 1. 缓存和记忆化 (Caching and Memoization)

这是 `WeakMap` 的主要应用场景。你可以为一个对象缓存一个昂贵计算的结果。如果该对象后来被销毁，缓存的结果也会被自动丢弃。

```javascript
const cache = new WeakMap();

function process(obj) {
  if (cache.has(obj)) {
    console.log("从缓存中返回...");
    return cache.get(obj);
  }

  console.log("正在计算新结果...");
  // 想象这是一个非常耗时的操作
  const result = `已处理对象 ID: ${obj.id}`;
  cache.set(obj, result);
  return result;
}

let myObj = { id: 123 };
process(myObj); // "正在计算新结果..."
process(myObj); // "从缓存中返回..."

// 当 myObj 不再被需要时，它在缓存中的条目也会随之消失，不会造成内存泄漏。
myObj = null;
```

### 2. 为对象存储私有数据或元数据

当你想要为一个对象关联一些数据，但又不想直接修改该对象（即不想添加像 `obj._mydata` 这样的属性）时，`WeakMap` 是完美的解决方案。这能保持对象纯净，并防止属性名冲突。

```javascript
// 假设这个类在一个库中，用于管理 DOM 元素
class ElementManager {
  constructor(element) {
    this.element = element;
    ElementManager.metadata.set(element, { clicks: 0 });
  }

  static metadata = new WeakMap();

  click() {
    const data = ElementManager.metadata.get(this.element);
    data.clicks++;
    console.log(`元素被点击了 ${data.clicks} 次。`);
  }
}

const myDiv = document.getElementById('my-div');
const manager = new ElementManager(myDiv);

myDiv.addEventListener('click', () => manager.click());

// 如果 'myDiv' 后来从 DOM 中被移除了，并且所有对它的引用都消失了，
// 那么在 WeakMap 中与之关联的元数据也会被垃圾回收。
```

### 3. 跟踪对象是否存在 (`WeakSet`)

`WeakSet` 对于检查你之前是否“见过”或“处理过”某个对象非常有用，尤其是在遍历复杂结构（如树或图）的算法中，你需要避免无限循环。

## 总结对比表

| 特性 | **`Map` / `Set` (强引用)** | **`WeakMap` / `WeakSet` (弱引用)** |
| :--- | :--- | :--- |
| **引用类型** | 强引用 | **弱引用** |
| **垃圾回收** | 阻止被引用的对象被 GC 回收。 | **不** 阻止 GC。对象被回收时，条目会自动移除。 |
| **内存泄漏** | 如果管理不当，可能导致泄漏。 | 帮助防止内存泄漏，实现自动清理。 |
| **允许的键/值**| 任何值（原始值和对象）。 | **仅限对象**。 |
| **可迭代** | **是** (`forEach`, `for...of` 等)。 | **否**。无法被迭代。 |
| **`size` 属性** | **有**。 | **没有**。 |
| **主要用途** | 通用的键值对或唯一值存储。 | 缓存、私有数据、元数据关联，且无内存泄漏风险。 |