---
title: Js 模块模式
description: ""
publishDate: 2025-09-17
tags:
  - JavaScript
draft: false
---

## 1. 传统的“模块模式”：返回一个对象

首先，我们来看一下更常见的模块模式，它通过返回一个对象来暴露公共 API。这个模式的核心是利用 **IIFE（立即执行函数表达式）** 和 **闭包**。

*   **IIFE (Immediately Invoked Function Expression)**: `(function(){ ... })();` 这种写法会创建一个函数并立即执行它。
*   **闭包 (Closure)**: 内部函数可以访问其外部（父级）函数作用域中的变量，即使外部函数已经执行完毕。

**示例：一个返回对象的计数器模块**

```javascript
const counterModule = (function() {
  // --- 私有部分 ---
  // 这个变量在模块外部无法直接访问
  let privateCount = 0;

  function privateIncrement() {
    privateCount++;
  }

  // --- 公共 API ---
  // 我们返回一个对象，这个对象上的方法可以访问私有变量
  return {
    increment: function() {
      privateIncrement();
      console.log('Count is now', privateCount);
    },
    getCount: function() {
      return privateCount;
    }
  };
})();

// --- 使用模块 ---
counterModule.increment();     // 输出: Count is now 1
counterModule.increment();     // 输出: Count is now 2
console.log(counterModule.getCount()); // 输出: 2
// console.log(counterModule.privateCount); // 错误！无法访问私有变量
```

在这个例子中，`counterModule` 是一个**对象**，它包含了我们希望公开的 `increment` 和 `getCount` 方法。这就是“从模块中返回一个实际的对象”的模式。

---

## 2. jQuery 的方式：返回一个函数

现在，我们进入主题：**模块不一定非要返回一个对象，它可以直接返回一个内部函数。**

为什么这么做有意义？因为 JavaScript 中，**函数是“一等公民”（First-class Citizens）**。这意味着：
* 函数可以像任何其他值一样被传递。
* 函数可以被赋值给变量。
* 函数可以作为参数传递给其他函数。
*   **最关键的一点：函数本身也是对象，所以它们可以拥有属性和方法！**

**jQuery 的核心思想：**
它的主要入口 `$` 或 `jQuery` 必须是一个**函数**，这样我们才能执行最常见的操作：`$('.my-element')`。这是一个函数调用。

但同时，jQuery 也提供了很多工具方法（utility methods），比如 `$.ajax()`、`$.each()`。这里的 `$` 看起来又像一个**对象**或**命名空间**。

jQuery 通过“返回一个函数，并给这个函数添加属性”的方式，完美地将这两种需求结合在了一起。

**概念性的 jQuery 结构简化版：**

```javascript
const $ = (function(window) {
  // --- 私有部分 ---
  // 很多私有的变量和帮助函数都在这里

  // --- 核心：将要作为模块 API 返回的函数 ---
  // 这个函数就是我们调用 `$('...')` 时执行的函数
  const jQuery = function(selector) {
    // 这里的逻辑是：接收一个选择器，
    // 查找 DOM 元素，然后返回一个包含了这些元素的
    // 特殊的 jQuery 对象实例，这个实例上有很多方法（如 .css(), .on() 等）
    // 为了简化，我们只打印一下
    console.log('jQuery function was called with selector:', selector);
    // 实际的 jQuery 在这里会返回 `new jQuery.fn.init(selector)`
    // 它是一个 jQuery 对象的实例
  };

  // --- 给返回的函数添加“静态”属性和方法 ---
  // 这使得 `jQuery` 同时扮演了命名空间的角色
  jQuery.version = '1.0.0';

  jQuery.ajax = function(options) {
    console.log('Making an AJAX request with options:', options);
    // ... AJAX 实现
  };

  jQuery.each = function(collection, callback) {
    console.log('Iterating over a collection...');
    // ... 循环实现
  };

  // --- 暴露给全局 ---
  // 返回这个核心函数，它现在既能被调用，又拥有属性
  return jQuery;

})(window); // 将全局 window 对象传入，以便在模块内部使用

// --- 使用 jQuery 模块 ---

// 1. 把它当作函数使用
$('.my-div');  // 输出: jQuery function was called with selector: .my-div

// 2. 把它当作对象使用，访问其属性和方法
console.log($.version); // 输出: 1.0.0
$.ajax({ url: '/api/data' }); // 输出: Making an AJAX request with options: { url: '/api/data' }
$.each([1, 2, 3], (i, val) => {}); // 输出: Iterating over a collection...
```

## 总结与深入理解

1.  **双重角色 API**：通过返回一个函数，`$` 获得了双重身份。
    *   **作为函数** (`$()`): 它是库的核心入口，用于执行最常见的操作（元素选择和包装）。这是它的“动词”形态。
    *   **作为对象/命名空间** (`$.ajax`): 它是一个容器，用于存放不依赖于特定 DOM 元素集合的“静态”工具方法。这是它的“名词”形态。

2.  **优雅与便利**：这种设计极其优雅。开发者只需要记住一个全局变量 `$` 就可以访问整个库的所有功能。它既是启动器，又是工具箱。

3.  **利用了 JavaScript 的本质**：这个模式的根基在于深刻理解了“函数即对象”。如果函数不能拥有属性，这种设计就无法实现。

4.  **私有性依然保持**：和返回对象的模块模式一样，IIFE 提供的闭包特性依然有效。所有在 IIFE 内部、但没有挂载到返回的 `jQuery` 函数上的变量和函数，都是私有的，外界无法访问，从而避免了全局命名空间的污染，并隐藏了复杂的内部实现。

这是一个非常棒的问题！看似一个微小的细节，背后却隐藏着 JavaScript 编程中多个重要的最佳实践。

将 `window` 作为参数传递给 IIFE（立即执行函数表达式），主要有以下三个核心原因：

---

## 1. 性能优化（理论上）

这是最经典、流传最广的原因。

*   **作用域链查找**：当你的代码使用一个变量时（比如 `window`），JavaScript 引擎会首先在当前函数的**局部作用域**中查找。如果没找到，它会向上一层作用域（父函数）查找，一直持续这个过程，直到找到该变量或者到达最顶层的**全局作用域**。

*   **局部变量 vs 全局变量**：
    *   `function() { var myVar = window; }`：在这里，`window` 是一个全局变量。引擎需要一直查找到全局作用域才能找到它。
    *   `function(win) { var myVar = win; }`：在这里，`win` 是一个**局部参数**。引擎在第一层（局部作用域）就能立刻找到它。

**结论**：访问局部变量比访问全局变量要快，因为它减少了作用域链的查找深度。通过 `(function(window){...})(window)`，我们把全局的 `window` 对象作为参数传了进去，在函数内部，`window` 就成了一个局部变量，从而（理论上）提高了访问速度。

> **现代视角的补充**：虽然这个理论是完全正确的，但在现代 JavaScript 引擎（如 V8）中，这种性能差异已经变得微乎其微，几乎可以忽略不计。引擎的优化能力非常强，可以很好地处理全局变量的访问。尽管如此，这仍然是该写法的历史和理论基础。

---

## 2. 代码压缩（Minification）

这是在现代前端工程化中一个**极其重要且实际**的原因。

代码压缩工具（如 Terser、UglifyJS）会通过缩短变量名来减小文件体积。

*   **压缩前的代码**：

    ```javascript
    (function(window, document) {
      // 模块内部大量使用了 window 和 document
      let element = window.document.getElementById('my-element');
      window.addEventListener('load', function() { /* ... */ });
      console.log('Current URL:', window.location.href);
    })(window, document);
    ```

*   **压缩后的代码**：

    ```javascript
    (function(w,d){let e=w.d.getElementById('my-element');w.addEventListener('load',function(){});console.log('Current URL:',w.location.href)})(window,document);
    ```

**分析**：
压缩工具知道 `window` 和 `document` 作为参数传入后，在函数内部它们只是局部变量，可以被安全地重命名。于是，它将 `window` 压缩成了 `w`，`document` 压缩成了 `d`。

如果你的代码里 `window` 这个词出现了 100 次，每次都从 6 个字符（`window`）缩短为 1 个字符（`w`），就能节省 **500 个字节**！这对于大型库（如 jQuery）或需要极致优化的网站来说，是非常可观的。

相反，如果直接在代码中使用全局 `window`，压缩工具不敢随意重命名它，因为它是一个不能被改变的宿主环境对象。

---

## 3. 可靠性和代码稳定性

这是从代码架构和健壮性角度考虑的最重要的原因。

它确保了模块内部使用的 `window` **就是你期望的那个 `window` 对象**，不会被意外覆盖。

想象一下，在你的模块加载之前，页面上存在另一段不规范的代码：

```javascript
// 某个第三方脚本或者糟糕的代码
window = { message: "This is not the real window object!" };

// 然后加载你的模块
(function(window) {
  // ...
  // 如果你的代码依赖 window.location 或 window.addEventListener
  // 就会在这里报错！因为 window 已经被污染了。
  window.addEventListener('load', ...); // TypeError: window.addEventListener is not a function

})(window); // 这里的 window 是被污染的那个对象
```

但是，通过 IIFE 的参数传递，我们创建了一个**闭包**，在模块定义的那一刻就锁定了对原始 `window` 对象的引用。这意味着，即使后续全局的 `window` 被修改，模块内部的 `window` 仍然是安全的、未被污染的原始版本。

**正确的方式**：
在 IIFE 执行时 (`...})(window)`)，它会立即获取**当前**的全局 `window` 对象并将其传入。函数内部的 `window` 参数就变成了对这个原始对象的局部引用。

```javascript
// 你的模块先加载
const myModule = (function(win) {
  // 在这里，'win' 锁定的是原始的、真正的 window 对象

  function doSomething() {
    // 即使全局 window 被覆盖，这里的 'win' 仍然安全可靠
    win.console.log("Hello from a safe context!");
  }

  return {
    run: doSomething
  };

})(window); // 此刻，将真正的 window 传入并锁定

// 之后，某个不规范的脚本污染了全局 window
window = { message: "I am fake!" };

// 调用你的模块，它依然可以正常工作！
myModule.run(); // 输出 "Hello from a safe context!"
// 直接调用 console.log(window.console) 则会报错
```

## 总结

所以，`(function(window){...})(window);` 这种写法是一个非常巧妙的多功能模式：

| 原因             | 解决的问题                               | 重要性（现代） |
| ---------------- | ---------------------------------------- | -------------- |
| **性能优化**     | 减少作用域链查找，加快变量访问           | 低             |
| **代码压缩**     | 允许将 `window` 压缩成单字母，减小文件体积 | **高**         |
| **可靠性/稳定性** | 保护模块免受全局 `window` 对象被污染的影响 | **非常高**     |