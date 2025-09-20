---
title: 柯里化（Currying）
description: ""
publishDate: 2025-09-20
tags:
  - JavaScript
draft: false
---



## 什么是柯里化 (Currying)？

柯里化是一种将一个接收**多个参数**的函数，转变为一系列只接收**一个参数**的函数的技术。

简单来说，假设你有一个函数 `f(a, b, c)`，通过柯里化，你可以将其转换为 `f(a)(b)(c)` 的形式。每一次调用只传递一个参数，并返回一个新的函数，这个新函数等待接收下一个参数，直到所有参数都传递完毕，最后返回最终的计算结果。

其核心思想是利用**闭包 (Closure)** 来“记住”已经传入的参数，直到函数所需的所有参数都集齐了才执行。

---

## 用法和代码实现

我们从一个简单的例子开始。

**1. 普通的多参数函数**

这是一个接收三个数字并返回它们之和的普通函数。

```javascript
function add(a, b, c) {
  return a + b + c;
}

console.log(add(1, 2, 3)); // 输出 6
```

**2. 手动实现柯里化版本**

我们可以手动将 `add` 函数改写成柯里化形式。

```javascript
function curriedAdd(a) {
  return function(b) {
    return function(c) {
      return a + b + c;
    };
  };
}

console.log(curriedAdd(1)(2)(3)); // 输出 6

// 你也可以分步调用
const add1 = curriedAdd(1);
const add1and2 = add1(2);
const finalResult = add1and2(3);

console.log(finalResult); // 输出 6
```

在这个例子中，`curriedAdd(1)` 返回了一个新的函数，这个新函数通过闭包记住了 `a=1`。接着 `add1(2)` 再次返回一个新函数，它记住了 `a=1` 和 `b=2`。最后 `add1and2(3)` 传入最后一个参数 `c=3`，执行最终的计算并返回结果。

**3. 通用的柯里化工具函数**

每次都手动写柯里化版本太麻烦了。我们可以编写一个通用的 `curry` 函数，它可以将任何普通函数转换为柯里化函数。

```javascript
// 这是一个通用的柯里化函数实现
function curry(fn) {
  // curry函数返回一个新的函数
  return function curried(...args) {
    // 检查当前收集到的参数数量 (args.length) 是否足够原函数 (fn.length) 执行
    if (args.length >= fn.length) {
      // 如果参数够了，就执行原函数并返回结果
      return fn.apply(this, args);
    } else {
      // 如果参数还不够，就返回一个新的函数，等待接收剩余的参数
      return function(...nextArgs) {
        // 当新函数被调用时，将之前收集的参数和新的参数合并，再次调用curried
        return curried.apply(this, [...args, ...nextArgs]);
      };
    }
  };
}

// --- 使用通用curry函数 ---
const add = (a, b, c) => a + b + c;

const curriedAdd = curry(add);

console.log(curriedAdd(1, 2, 3));    // 输出 6 (一次性传入所有参数)
console.log(curriedAdd(1)(2, 3));    // 输出 6 (分两次传入)
console.log(curriedAdd(1)(2)(3)); // 输出 6 (分三次传入)
```

这个通用 `curry` 函数更加强大和灵活，它允许你以任何组合方式传递参数。

> 在实际项目中，你也可以使用 Lodash 库提供的 `_.curry` 方法，它功能更完善。

---

## 主要使用场景

柯里化不仅仅是一种代码技巧，它在实际开发中有很多非常实用的场景。

### 1. 参数复用 (Parameter Reusability)

这是柯里化最常见的用途。当你需要频繁调用一个函数，并且其中某些参数是固定的，柯里化可以帮助你创建一个更简洁的“定制版”函数。

**场景示例：校验**

假设你有一个通用的正则表达式校验函数。

```javascript
// 通用校验函数
function check(regex, str) {
  return regex.test(str);
}

// 使用柯里化
const curriedCheck = curry(check);

// 创建特定用途的校验函数，复用了第一个参数 (regex)
const isNumber = curriedCheck(/^\d+$/);
const isEmail = curriedCheck(/^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/);

// 现在使用起来非常方便和清晰
console.log(isNumber('12345'));    // 输出 true
console.log(isNumber('abc'));      // 输出 false
console.log(isEmail('test@gmail.com')); // 输出 true
```

通过柯里化，我们轻松地创建了 `isNumber` 和 `isEmail` 两个新函数，它们的代码更具可读性，并且避免了重复编写正则表达式。

### 2. 延迟执行 (Delayed Execution)

柯里化返回的是一个函数，这意味着计算可以被推迟。这在某些异步操作或事件处理中非常有用。

**场景示例：日志记录**

假设你需要一个日志函数，可以根据不同的级别（如 INFO, DEBUG, ERROR）来记录信息。

```javascript
// 假设有一个日志函数 log(level, message)
const log = (level, message) => console.log(`[${level}] ${message}`);

// 柯里化这个log函数
const curriedLog = curry(log);

// 创建特定级别的日志记录器
const infoLog = curriedLog('INFO');
const errorLog = curriedLog('ERROR');

// 在代码的不同地方，你可以直接使用这些“定制”好的函数
infoLog('这是一条信息日志。');    // 输出: [INFO] 这是一条信息日志。
infoLog('系统启动成功。');        // 输出: [INFO] 系统启动成功。

// ... 若干代码后 ...
errorLog('出现了一个严重错误！'); // 输出: [ERROR] 出现了一个严重错误！
```

比如在一个按钮的点击事件中，你可以提前绑定好部分参数，等到用户点击时再传入最后一个参数（比如事件对象 `event`）来完成最终操作。

### 3. 函数组合 (Function Composition)

在函数式编程中，我们常常需要将多个小函数组合成一个大函数。柯里化使得函数组合变得更加容易和自然。

**场景示例：数据处理管道**

假设你想对一个数字进行一系列操作：先乘以 2，然后加 10。

```javascript
const multiply = (a, b) => a * b;
const add = (a, b) => a + b;

const curriedMultiply = curry(multiply);
const curriedAdd = curry(add);

const multiplyBy2 = curriedMultiply(2); // 创建一个乘以2的函数
const add10 = curriedAdd(10);           // 创建一个加10的函数

// 手动组合
const process = (x) => add10(multiplyBy2(x));
console.log(process(5)); // (5 * 2) + 10 = 20

// 使用通用的 compose 函数会更优雅
const compose = (f, g) => (x) => f(g(x));

const processWithCompose = compose(add10, multiplyBy2);
console.log(processWithCompose(5)); // 20
```

因为柯里化函数 `multiplyBy2` 和 `add10` 都只接收一个参数，它们非常适合被 `compose` 函数串联起来，形成一个清晰的数据处理管道。

---

## 总结

*   **是什么**：柯里化是将多参数函数转换成一系列单参数函数的过程。
*   **如何实现**：利用闭包存储已经传入的参数，并返回一个等待接收新参数的新函数。
*   **为什么用**：
    *   **参数复用**：创建可复用的、特定化的函数，提高代码可读性和简洁性。
    *   **延迟执行**：将计算推迟到所有参数都准备就绪时再执行。
    *   **函数组合**：方便地将多个函数组合成一个功能更强大的函数。

虽然柯里化在某些情况下可能显得代码更复杂，但在函数式编程和需要高度抽象的场景中，它是一个非常强大的工具。