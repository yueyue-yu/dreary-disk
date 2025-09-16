---
title: Array.from
description: ""
publishDate: 2025-09-16
tags:
  - JavaScript
draft: false
---




## 1. 类数组对象 (Array-like Objects)

### 什么是类数组对象？

类数组对象是指在结构上看起来像数组，但实际上是普通对象。它们满足以下两个核心特征：

1.  **具有一个 `length` 属性**，该属性通常为非负整数。
2.  **具有按索引访问的属性**（即，键为 "0", "1", "2" 等字符串）。

**关键点**：它们**不是**真正的数组。因此，它们不具备数组原型上的方法，比如 `forEach()`, `map()`, `filter()`, `reduce()` 等。

### 常见的类数组对象示例

*   **`arguments` 对象**：在函数（非箭头函数）内部，`arguments` 对象包含了所有传入函数的参数。

    ```javascript
    function showArgs() {
      console.log(arguments); // { '0': 'hello', '1': 'world', length: 2 }
      console.log(arguments.length); // 2
      console.log(arguments[0]); // 'hello'
      // arguments.forEach(arg => console.log(arg)); // 这会报错! Uncaught TypeError: arguments.forEach is not a function
    }
    showArgs('hello', 'world');
    ```

*   **DOM 集合**：通过某些 DOM API 获取的元素集合，例如 `document.getElementsByTagName()` 或 `document.querySelectorAll()` 返回的 `HTMLCollection` 或 `NodeList`。

    ```javascript
    // 假设 HTML 中有多个 <div> 元素
    const divs = document.getElementsByTagName('div');
    console.log(divs.length); // 假设有 3 个 div，则输出 3
    console.log(divs[0]);     // 输出第一个 div 元素
    // 在旧版浏览器中，divs.forEach 可能会报错。现代浏览器大多已经为 NodeList 实现了 forEach。
    ```

*   **自定义对象**：

    ```javascript
    const arrayLike = {
      0: 'a',
      1: 'b',
      2: 'c',
      length: 3
    };
    ```

## 2. 可迭代对象 (Iterable Objects)

### 什么是可迭代对象？

这是 ES6 引入的一个重要概念，它是一种**协议（Protocol）**。如果一个对象实现了**可迭代协议**，那么它就是可迭代对象。

**可迭代协议**：对象必须实现 `Symbol.iterator` 方法。这个方法是一个无参数的函数，它返回一个**迭代器（Iterator）**对象。

**迭代器协议**：迭代器对象需要有一个 `next()` 方法。每次调用 `next()` 方法，它会返回一个包含 `value` 和 `done` 两个属性的对象。
*   `value`: 当前遍历到的值。
*   `done`: 一个布尔值，表示遍历是否结束。`false` 表示未结束，`true` 表示已结束。

### 常见的可迭代对象示例

JavaScript 中许多内置类型都是可迭代的：

*   `Array` (数组)
*   `String` (字符串)
*   `Map`
*   `Set`
*   `TypedArray` (类型化数组)
*   `NodeList` (DOM 集合)
*   `arguments` 对象

### 可迭代对象的用途

可迭代对象是专门为被某些语法结构消费而设计的，最常见的消费场景包括：

*   **`for...of` 循环**: 这是遍历可迭代对象最直接的方式。

    ```javascript
    const str = "abc";
    for (const char of str) {
      console.log(char); // 依次输出 a, b, c
    }

    const mySet = new Set(['x', 'y', 'z']);
    for (const item of mySet) {
      console.log(item); // 依次输出 x, y, z
    }
    ```

*   **扩展语法 (`...`)**: 用于数组字面量、函数调用等。

    ```javascript
    const str = "abc";
    const arr = [...str]; // ['a', 'b', 'c']
    ```

*   **`Array.from()`**: 后面会详细讲。
*   **`Promise.all()` / `Promise.race()`** 等接受一个可迭代对象。

> **小结**：一个对象可以是类数组对象，也可以是可迭代对象，或者两者都是（如数组）。字符串是可迭代的，但不是典型的类数组对象（尽管它也有 `length` 和索引访问）。普通的类数组对象（如我们自定义的 `arrayLike`）默认是不可迭代的。

---

## 3. `Array.from()` 方法

`Array.from()` 是一个非常强大的方法，它的核心作用是**从一个类数组对象或可迭代对象创建一个新的、浅拷贝的数组实例**。

### 语法

```javascript
Array.from(arrayLikeOrIterable, [mapFn], [thisArg])
```

1.  `arrayLikeOrIterable`: 必需，要转换的类数组对象或可迭代对象。
2.  `mapFn`: 可选，一个映射函数。新数组的每个元素都会经过这个函数的处理。它类似于数组的 `map()` 方法。
3.  `thisArg`: 可选，执行 `mapFn` 时 `this` 的值。

### `Array.from()` 的应用场景

1.  **将类数组对象转换为真数组**：这是它的经典用途，转换后就可以使用所有数组方法。

    ```javascript
    function sumAllArgs() {
      // 1. 将 arguments 转换为真数组
      const argsArray = Array.from(arguments);
      // 2. 现在可以使用 reduce 方法了
      return argsArray.reduce((sum, current) => sum + current, 0);
    }
    console.log(sumAllArgs(1, 2, 3, 4)); // 输出 10
    ```

2.  **将可迭代对象转换为真数组**：

    ```javascript
    const mySet = new Set(['a', 'b', 'c']);
    const arrFromSet = Array.from(mySet); // ['a', 'b', 'c']

    const str = "hello";
    const arrFromStr = Array.from(str); // ['h', 'e', 'l', 'l', 'o']
    ```

3.  **使用映射函数 `mapFn` 创建和填充数组**：这是 `Array.from()` 一个非常巧妙的用法。

    ```javascript
    // 创建一个包含 5 个 undefined 的数组，然后对每个元素进行映射
    // (v, i) 分别代表 value (此时是 undefined) 和 index
    const squares = Array.from({ length: 5 }, (v, i) => i * i);
    console.log(squares); // [0, 1, 4, 9, 16]

    // 创建一个 1 到 5 的数字序列
    const sequence = Array.from({ length: 5 }, (v, i) => i + 1);
    console.log(sequence); // [1, 2, 3, 4, 5]
    ```

    这个功能比 `new Array(5).map(...)` 更优越，因为 `new Array(5)` 创建的是一个包含 5 个空槽（empty slots）的数组，而 `map` 会跳过这些空槽。`Array.from` 则不会。

---

## 拓展相关主题

### 1. 扩展语法 (`...`) vs. `Array.from()`

扩展语法 (`...`) 也能将可迭代对象转换为数组，它更简洁：

```javascript
const mySet = new Set(['a', 'b', 'c']);
const arr = [...mySet]; // ['a', 'b', 'c']
```

**区别**:
*   `Array.from()` 功能更强大，它可以转换**非可迭代**的类数组对象，并且支持映射函数。
* 扩展语法 (`...`) 只能作用于**可迭代对象**。如果你尝试对一个不是可迭代对象的纯类数组对象使用扩展语法，会抛出 `TypeError`。

```javascript
const arrayLike = { 0: 'a', 1: 'b', length: 2 };

const arr1 = Array.from(arrayLike); // 成功: ['a', 'b']
// const arr2 = [...arrayLike];      // 失败: Uncaught TypeError: arrayLike is not iterable
```

### 2. Generator 函数（生成器）

如果你想创建自定义的可迭代对象，Generator 函数是最简单的方式。它通过 `function*` 语法和 `yield` 关键字，让你能够方便地定义迭代行为。

```javascript
// 这是一个 Generator 函数，它返回一个迭代器
function* numberGenerator() {
  yield 1;
  yield 2;
  yield 3;
}

// numberGenerator() 返回的迭代器可以直接被消费
const gen = numberGenerator();

// 1. 使用 for...of
for (const num of gen) {
  console.log(num); // 依次输出 1, 2, 3
}

// 2. 或者使用 Array.from()
const arrFromGen = Array.from(numberGenerator());
console.log(arrFromGen); // [1, 2, 3]
```

Generator 极大地简化了创建复杂或无限序列（如斐波那契数列）的迭代器。

## 总结

| 特性 | **类数组对象 (Array-like)** | **可迭代对象 (Iterable)** |
| :--- | :--- | :--- |
| **核心标志** | 具有 `length` 属性和索引访问 | 实现了 `[Symbol.iterator]` 方法 |
| **原生方法** | 无数组方法 (`forEach`, `map` 等) | 不一定有，但可以被特定语法消费 |
| **主要用途** | 作为一种历史遗留的数据结构存在 (如 `arguments`) | 为 `for...of`、`...` 等提供统一的遍历接口 |
| **转换为数组** | 推荐使用 `Array.from()` | 使用 `Array.from()` 或扩展语法 (`...`) |

`Array.from()` 是一个连接这两者的桥梁，它提供了一种统一、强大且灵活的方式来创建真正的数组，是现代 JavaScript 开发中处理集合数据时非常有用的工具。