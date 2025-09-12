---
title: "JavaScript var 核心特性与实践指南"
description: "梳理 var 的函数作用域、变量提升、可重复声明与全局对象挂载等特性，分析 setTimeout 循环等典型陷阱，并与 let/const 对比给出现代使用建议。"
publishDate: "2025-09-12"
tags: ["JavaScript", "var", "作用域", "变量提升", "let", "const"]
draft: false
---

### JavaScript `var` 核心特性与实践指南
`var` 是 JavaScript 早期的变量声明方式，其核心特性——**函数作用域**和**变量提升**——是理解许多经典 JS “陷阱”的关键。
### 核心特性
### 1. 函数作用域 (Function Scope)
变量的有效范围仅限于其所在的**整个函数体**，完全忽略 `{}` 块级结构（如 `if`, `for`）。
**案例 1：**`**if**` **块**
```JavaScript
function testScope() {
  if (true) {
    var color = "blue";
  }
  console.log(color); // 输出 "blue" (color 泄露到了函数作用域)
}
testScope();
// console.log(color); // ReferenceError: color is not defined (函数外不可访问)
```
**案例 2：**`**for**` **循环**
```JavaScript
function loopTest() {
  for (var i = 0; i < 3; i++) {
    // ...
  }
  console.log(i); // 输出 3 (循环结束后，i 依然存在于函数作用域)
}
loopTest();
```
### 2. 变量提升 (Hoisting)
声明被“提升”到作用域顶部，但赋值操作留在原地。在声明前访问不会报错，值为 `undefined`。
**案例 1：基础提升**
```JavaScript
console.log(myVar); // undefined (声明已提升，但未赋值)
var myVar = "Hello";
console.log(myVar); // "Hello"
// JS 引擎解析为：
// var myVar;
// console.log(myVar);
// myVar = "Hello";
// console.log(myVar);
```
**案例 2：函数中的提升**
```JavaScript
function hoistInFunc() {
  console.log(a); // undefined
  if (false) {
    var a = 1; // 即使代码块不执行，声明依然被提升
  }
  console.log(a); // undefined
}
hoistInFunc();
```
### 3. 可重复声明 (Redeclaration)
在同一作用域内，可以多次声明同名变量，后者会静默地覆盖前者，不会报错。
**案例**
```JavaScript
var user = "Alice";
console.log(user); // "Alice"
var user = "Bob"; // 不会报错，静默覆盖
console.log(user); // "Bob"
// 这是大型项目中 bug 的常见来源。
```
### 4. 挂载于全局对象 (Global Object Property)
在顶层作用域（函数外）声明的 `var` 变量，会自动成为全局对象（浏览器中为 `window`）的属性。
**案例**
```JavaScript
var appName = 'MyApp';
console.log(window.appName); // "MyApp" (在浏览器中)
// 风险：极易造成全局命名空间污染和意外覆盖。
// 比如第三方库也定义了 window.appName，你的变量就会被覆盖。
```
---
### 典型陷阱与场景
### 场景 1：循环陷阱 (`setTimeout`)
这是最经典的 `var` 问题，完美体现了函数作用域的缺陷。
```JavaScript
for (var i = 0; i < 3; i++) {
  // i 是共享的，setTimeout 回调执行时，循环早已结束
  setTimeout(() => {
    console.log(i); // 输出 3, 3, 3
  }, 10);
}
```
**原因**：`setTimeout` 是异步的。当回调函数执行时，循环已经完成，此时 `i` 的最终值是 `3`。所有回调函数共享同一个函数作用域下的 `i`。
**现代解决方案**：使用 `let`，它具有块级作用域，每次循环都会创建一个新的 `i`。
```JavaScript
for (let i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i); // 输出 0, 1, 2
  }, 10);
}
```
### 场景 2：条件声明
由于变量提升，即使 `if` 条件不满足，变量声明也已存在。
```JavaScript
function conditionalVar(condition) {
  if (condition) {
    var value = "Blue";
    console.log(value); // "Blue"
  } else {
    // 此处 value 依然存在，值为 undefined
    console.log(value); // undefined (不会报错)
  }
  // 在函数任何地方，value 都是已声明的
  console.log(value); // condition=true 时为 "Blue", false 时为 undefined
}
conditionalVar(true);
conditionalVar(false);
```
---
### `var` vs `let` / `const` 核心对比
|特性|`var`|`let` / `const`|
|---|---|---|
|**作用域**|**函数作用域**|**块级作用域 (**`**{}**` **内)**|
|**变量提升**|提升，并初始化为 `undefined`|提升，但不初始化 (**暂时性死区 TDZ**)|
|**重复声明**|**允许** (易产生 Bug)|**禁止** (更安全)|
|**全局对象**|**会**挂载到 `window`|**不会**挂载到 `window`|
|**使用建议**|**避免使用**|**优先使用** `**const**`**，需要改变时用** `**let**`|
### 现代开发建议
**果断弃用** `**var**`**，全面拥抱** `**let**` **和** `**const**`**。**
- `**let**`：用于声明**可变**的变量。
- `**const**`：用于声明**不可变**的常量（对于对象和数组，是引用不可变）。
**理由：**
1. **作用域更清晰**：块级作用域符合大多数编程语言的逻辑，能有效减少 bug。
2. **避免意外**：禁止重复声明和暂时性死区的存在，让代码更健壮、可预测。
3. **代码更纯净**：不会污染全局对象，利于模块化和代码维护。
