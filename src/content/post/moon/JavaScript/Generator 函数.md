---
title: Generator 函数
description: ""
publishDate: 2025-09-28
tags:
  - JavaScript
draft: false
---



## Generator 函数（生成器）

Generator 函数是 ES6 引入的一种特殊类型的函数。它不像普通函数那样“运行到结束”，而是可以在执行过程中**暂停**和**恢复**。这种能力使得它成为创建自定义可迭代对象和管理异步流程的理想工具。

### 核心特征

1.  **声明方式**: 使用 `function*` 语法（注意星号 `*`）。
2.  **执行控制**: 函数体内部使用 `yield` 关键字来暂停函数的执行，并可以向外返回一个值。
3.  **返回值**: 调用一个 Generator 函数**并不会立即执行函数体**，而是返回一个 **Generator 对象**。这个对象是一个迭代器，同时也是可迭代的。
4.  **双向通信**: Generator 不仅可以向外 `yield` 值，还可以接收来自外部的值，实现函数内外部的双向通信。

---

### 1. 基本语法与工作原理

#### 声明和执行

让我们从一个最简单的例子开始，理解 Generator 是如何工作的。

```javascript
// 1. 定义一个 Generator 函数
function* simpleGenerator() {
  console.log('执行到第 1 个 yield 前');
  yield 1; // 暂点 1: 暂停，并返回值 1

  console.log('执行到第 2 个 yield 前');
  yield 2; // 暂点 2: 暂停，并返回值 2

  console.log('执行到第 3 个 yield 前');
  yield 3; // 暂点 3: 暂停，并返回值 3

  console.log('Generator 函数执行完毕');
}

// 2. 调用 Generator 函数，得到一个 Generator 对象
const genObj = simpleGenerator();

console.log('Generator 对象已创建，但函数体尚未执行。');
console.log(genObj); // 输出: simpleGenerator {<suspended>}
```

**关键点**: 此时，`simpleGenerator` 函数体内的代码一行都没有执行。`genObj` 是一个“待命”状态的对象。

#### `next()` 方法

Generator 对象有一个核心方法 `next()`，用于启动或恢复函数的执行。

```javascript
// 接上面的代码

// 3. 第一次调用 next()，启动 Generator
let result1 = genObj.next();
// 函数开始执行，直到遇到第一个 yield
// 控制台输出: "执行到第 1 个 yield 前"
console.log(result1); // 输出: { value: 1, done: false }
//   - value: yield 后面表达式的值 (这里是 1)
//   - done: 表示 Generator 是否已执行完毕 (false 表示未完成)

// 4. 第二次调用 next()，从上次暂停处恢复执行
let result2 = genObj.next();
// 函数从上次 yield 1 的地方继续执行，直到遇到下一个 yield
// 控制台输出: "执行到第 2 个 yield 前"
console.log(result2); // 输出: { value: 2, done: false }

// 5. 第三次调用 next()
let result3 = genObj.next();
// 控制台输出: "执行到第 3 个 yield 前"
console.log(result3); // 输出: { value: 3, done: false }

// 6. 第四次调用 next()
let result4 = genObj.next();
// 函数从上次 yield 3 的地方继续执行，直到函数结束
// 控制台输出: "执行到第 3 个 yield 前"
// 控制台输出: "Generator 函数执行完毕"
console.log(result4); // 输出: { value: undefined, done: true }
//   - value: 函数执行完毕，没有 return 语句，所以是 undefined
//   - done: true 表示 Generator 已完全执行完毕

// 7. 如果在已完成的 Generator 上再次调用 next()
let result5 = genObj.next();
console.log(result5); // 输出: { value: undefined, done: true }
// 它只会一直返回这个结果
```

**工作流程总结**:
`next()` 调用 -> Generator 运行 -> 遇到 `yield` 暂停 -> 返回 `{ value: ..., done: false }` -> 再次调用 `next()` -> 从暂停处恢复运行 -> ... -> 函数结束 -> 返回 `{ value: ..., done: true }`。

---

### 2. Generator 是可迭代对象

这是 Generator 最常见的用途之一。一个对象是可迭代的，如果它拥有 `[Symbol.iterator]` 方法，并且该方法返回一个迭代器。Generator 对象**既是迭代器，也是可迭代对象**（它的 `[Symbol.iterator]` 方法返回它自身）。

这意味着我们可以直接在 `for...of` 循环、扩展运算符 `...` 等地方使用 Generator 对象。

#### 示例：使用 `for...of` 遍历 Generator

```javascript
function* numberGenerator() {
  yield 10;
  yield 20;
  yield 30;
}

const gen = numberGenerator();

// for...of 循环会自动调用 next()，直到 done 为 true
// 它会自动忽略最后一个 { value: undefined, done: true } 的结果
for (const value of gen) {
  console.log(value);
}

// 输出:
// 10
// 20
// 30
```

#### 示例：与扩展运算符 `...` 结合使用

```javascript
function* idGenerator() {
  yield 'id_a';
  yield 'id_b';
  yield 'id_c';
}

const ids = [...idGenerator()];
console.log(ids); // 输出: ['id_a', 'id_b', 'id_c']

// 也可以用于 Set 或 Map
const idSet = new Set(idGenerator());
console.log(idSet); // 输出: Set(3) { 'id_a', 'id_b', 'id_c' }
```

这完美地印证了你之前的观点：**“如果你想创建自定义的可迭代对象，Generator 函数是最简单的方式。”**

---

### 3. `yield*` - 委托给其他 Generator

`yield*` 表达式用于在一个 Generator 函数内部“委托”或“代理”执行另一个可迭代对象（包括另一个 Generator）。它会将自身的执行权交给被委托的可迭代对象，直到其迭代完毕，然后再恢复自身的执行。

#### 示例：组合多个 Generator

```javascript
function* g1() {
  yield 1;
  yield 2;
}

function* g2() {
  yield 'a';
  yield 'b';
}

function* combinedGenerator() {
  console.log('Combined started');
  yield* g1(); // 委托给 g1，g1 会完全执行
  console.log('Back from g1');
  yield* g2(); // 委托给 g2，g2 会完全执行
  console.log('Back from g2');
  yield 'Final';
}

const combined = combinedGenerator();

for (const val of combined) {
  console.log(val);
}

// 输出:
// Combined started
// 1
// 2
// Back from g1
// a
// b
// Back from g2
// Final
```

如果没有 `yield*`，`yield g1()` 只会 yield 出整个 `g1()` 返回的 Generator 对象，而不是它的值。`yield*` 是实现 Generator 组合的关键。

---

### 4. 双向通信：向 Generator 传递数据

`next()` 方法不仅可以恢复 Generator 的执行，还可以向其内部传递一个值。这个值会成为 `yield` 表达式**整体的返回值**。

这是一个非常强大的概念，它让 Generator 变成了一个“协程”（coroutine），可以在不同的时间点与外部世界进行数据交换。

#### 示例：一个简单的数据处理器

```javascript
function* dataProcessor() {
  console.log('Processor ready. Waiting for first data...');
  // 第一个 next() 启动 Generator，执行到这里暂停
  // result1 的值是第一个 next() 调用时传入的参数
  const result1 = yield; // 注意：yield 后面没有表达式，它只负责接收

  console.log(`Received first data: ${result1}. Processing...`);
  const processedData = result1 * 2;

  console.log('Waiting for second data...');
  // 第二个 next() 调用时，传入的参数会成为下面这个 yield 的返回值
  const result2 = yield processedData;

  console.log(`Received second data: ${result2}. Final processing...`);
  return result2 + 100; // 最终返回值
}

const processor = dataProcessor();

// 1. 启动 Generator，执行到第一个 yield
// 传入的值 "ignored" 会被忽略，因为第一个 yield 没有接收者
// 我们通常用不带参数的 next() 来启动
const startResult = processor.next(); 
console.log(startResult); // 输出: { value: undefined, done: false }
// 控制台输出: "Processor ready. Waiting for first data..."

// 2. 传入数据 5，恢复执行
// 5 会被赋值给 const result1 = yield;
const step1Result = processor.next(5);
console.log(step1Result); // 输出: { value: 10, done: false }
// 控制台输出: "Received first data: 5. Processing..."
// 控制台输出: "Waiting for second data..."

// 3. 传入数据 20，恢复执行
// 20 会被赋值给 const result2 = yield processedData;
const step2Result = processor.next(20);
console.log(step2Result); // 输出: { value: 120, done: true }
// 控制台输出: "Received second data: 20. Final processing..."
```

**通信流程**:
`next()` 启动 -> `yield` 暂停 -> `next(data)` 恢复 -> `data` 被赋值给 `yield` 表达式 -> ... -> `return value` -> `{ value: value, done: true }`。

---

### 5. 实际应用场景

#### 场景一：创建复杂的数据序列

Generator 非常适合生成按需计算的无限或复杂序列，而无需预先分配大量内存。

```javascript
// 生成斐波那契数列
function* fibonacci() {
  let a = 0, b = 1;
  while (true) { // 这是一个无限序列！
    yield a;
    [a, b] = [b, a + b]; // ES6 解构赋值，优雅地交换和计算
  }
}

const fib = fibonacci();

console.log(fib.next().value); // 0
console.log(fib.next().value); // 1
console.log(fib.next().value); // 1
console.log(fib.next().value); // 2
console.log(fib.next().value); // 3
console.log(fib.next().value); // 5

// 只取前 10 个
const firstTenFib = [];
const fibGen = fibonacci();
for (let i = 0; i < 10; i++) {
  firstTenFib.push(fibGen.next().value);
}
console.log(firstTenFib); // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

#### 场景二：异步流程控制（`async/await` 的前身）

在 `async/await` 普及之前，Generator 是解决“回调地狱”和实现同步化异步代码的主要方案。通过配合一个被称为“运行器”（runner）的库，我们可以用类似同步的代码来写异步逻辑。

**核心思想**:
1.  将异步操作（如 `fetch`）包装成一个 Promise。
2.  在 Generator 中 `yield` 这个 Promise。
3.  “运行器”负责：
    * 调用 `next()` 启动 Generator。
    * 得到 `yield` 出来的 Promise。
    * 等待 Promise 完成（`.then()`）。
    * 将 Promise 的结果通过 `next(result)` 传回 Generator。
    * 重复此过程，直到 Generator 完成。

**模拟一个简单的运行器**:

```javascript
// 模拟一个异步操作，返回 Promise
function fetchData(url) {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log(`Fetched data from ${url}`);
      resolve(`Data from ${url}`);
    }, 1000);
  });
}

// 使用 Generator 管理异步流程
function* asyncTask() {
  console.log('Task started.');
  const data1 = yield fetchData('/api/user');
  console.log(`Got user data: ${data1}`);

  const data2 = yield fetchData(`/api/posts?user=${data1.split(' ')[2]}`);
  console.log(`Got post data: ${data2}`);

  return 'All tasks completed!';
}

// 简单的运行器
function run(generator) {
  const gen = generator();

  function handleNext(result) {
    // 如果 Generator 结束了
    if (result.done) {
      console.log('Runner finished:', result.value);
      return;
    }

    // result.value 是 yield 出来的 Promise
    const promise = result.value;
  
    // 等待 Promise 完成，然后将结果传回 Generator
    promise.then(
      data => handleNext(gen.next(data)), // 成功时，将数据传回
      error => gen.throw(error)           // 失败时，向 Generator 抛出错误
    );
  }

  // 启动 Generator
  handleNext(gen.next());
}

// 执行异步任务
run(asyncTask);

// 输出顺序:
// Task started.
// (等待 1 秒)
// Fetched data from /api/user
// Got user data: Data from user
// (等待 1 秒)
// Fetched data from /api/posts?user=user
// Got post data: Data from /api/posts?user=user
// Runner finished: All tasks completed!
```

这个模式就是 `async/await` 的底层原理。`async` 函数本质上就是一个能自动执行自己的 Generator 函数的“运行器”，而 `await` 关键字就相当于 `yield`。

---

### 总结

| 特性 | 描述 |
| :--- | :--- |
| **声明** | `function* name() { ... }` |
| **核心操作** | `yield value` - 暂停并返回值。`next(data)` - 恢复并传入值。 |
| **返回对象** | Generator 对象，它既是**迭代器**（有 `next()` 方法），也是**可迭代对象**（有 `[Symbol.iterator]`）。 |
| **主要用途** | 1. **创建自定义可迭代对象**：比手动实现迭代器协议简单得多。<br>2. **生成数据序列**：特别是无限或按需计算的序列。<br>3. **异步流程控制**：以同步的方式编写异步代码，是 `async/await` 的基础。 |
| **高级语法** | `yield*` - 用于委托给其他可迭代对象，实现 Generator 组合。 |
| **双向通信** | `next()` 可以传值，该值会成为 `yield` 表达式的返回值，实现内外数据交换。 |

Generator 函数是 JavaScript 中一个深刻而强大的特性。虽然 `async/await` 在异步领域已成为主流，但理解 Generator 的工作原理对于深入掌握 JavaScript 的执行模型和迭代机制至关重要，并且在某些特定场景下（如复杂序列生成），它依然是不可替代的最佳工具。