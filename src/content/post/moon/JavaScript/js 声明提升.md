---
title: js 声明提升
description: ""
publishDate: 2025-09-17
tags:
  - JavaScript
draft: false
---


在 JavaScript 中，**声明提升（Hoisting）** 是一个在代码执行前，JavaScript 引擎将 `var`、`let`、`const`、`function` 和 `class` 的声明从它们的作用域（全局或函数作用域）中“移动”到顶部的过程。

需要注意的是，**只有声明本身被提升，赋值（初始化）操作会留在原地**。不同类型的声明，其提升行为也有所不同。

下面是各种情况的详细说明：

## 1. `var` 变量声明

使用 `var` 声明的变量会被提升，但只有声明本身被提升，赋值操作会留在原地。被提升的变量在显式赋值前的值是 `undefined`。

**示例：**

```javascript
console.log(myVar); // 输出: undefined
var myVar = 5;
console.log(myVar); // 输出: 5
```

**背后原理（引擎如何解析）：**

```javascript
// 引擎在执行前
var myVar; // 声明被提升到顶部，并初始化为 undefined

// 代码执行时
console.log(myVar); // 输出 undefined
myVar = 5;          // 赋值操作留在原地
console.log(myVar); // 输出 5
```

## 2. `function` 函数声明

函数声明是**完全提升**的，这意味着整个函数体（包括名称和实现）都会被提升到作用域的顶部。因此，你可以在函数声明之前调用它。

**示例：**

```javascript
sayHello(); // 输出: "Hello!"

function sayHello() {
  console.log("Hello!");
}
```

**背后原理（引擎如何解析）：**

```javascript
// 引擎在执行前
function sayHello() { // 整个函数被提升到顶部
  console.log("Hello!");
}

// 代码执行时
sayHello(); // "Hello!"
```

## 3. `let` 和 `const` 变量/常量声明

`let` 和 `const` 声明也会被提升，但它们有一个重要的不同点：它们**不会被初始化为 `undefined`**。从作用域顶部到声明语句本身之间的区域被称为 **“暂时性死区”（Temporal Dead Zone, TDZ）**。在此区域内访问这些变量会导致 `ReferenceError`。

这种机制可以帮助开发者避免在变量声明前就使用变量的错误。

**示例：**

```javascript
console.log(myLet); // 抛出 ReferenceError: Cannot access 'myLet' before initialization
let myLet = 10;

console.log(myConst); // 抛出 ReferenceError: Cannot access 'myConst' before initialization
const myConst = 20;
```

**背后原理：**

```javascript
// let myLet; -> 声明被提升，但处于 TDZ 中，未初始化
// const myConst; -> 声明被提升，但处于 TDZ 中，未初始化

// 代码执行时
console.log(myLet); // 访问 TDZ 中的变量，抛出 ReferenceError

let myLet = 10; // 初始化完成，TDZ 结束
```

## 4. 函数表达式 (Function Expression)

函数表达式的提升行为取决于声明它时使用的关键字（`var`, `let`, `const`）。它本质上是一个变量赋值，因此遵循变量的提升规则。

**使用 `var` 的函数表达式：**
变量名被提升并初始化为 `undefined`，但函数体没有。在赋值之前调用它会引发 `TypeError`。

```javascript
console.log(myFunc); // 输出: undefined
myFunc(); // 抛出 TypeError: myFunc is not a function

var myFunc = function() {
  console.log("This is a function expression.");
};
```

**背后原理：**
`myFunc` 变量的声明被提升了，但它的值是 `undefined`，而不是一个函数。

**使用 `let` 或 `const` 的函数表达式：**
变量名被提升，但处于暂时性死区（TDZ），在声明前访问会引发 `ReferenceError`。

```javascript
myFunc(); // 抛出 ReferenceError: Cannot access 'myFunc' before initialization

const myFunc = function() {
  console.log("This is a function expression.");
};
```

## 5. `class` 类声明

类声明的提升方式与 `let` 和 `const` 类似。它们也会被提升到作用域顶部，但存在于暂时性死区（TDZ）中。在声明之前尝试访问或实例化一个类，会引发 `ReferenceError`。

**示例：**

```javascript
const myCar = new Car(); // 抛出 ReferenceError: Cannot access 'Car' before initialization

class Car {
  constructor() {
    this.brand = "Ford";
  }
}
```

## 总结与最佳实践

| 声明方式 | 声明是否提升？ | 提升后的初始值 | 暂时性死区 (TDZ) |
| :--- | :--- | :--- | :--- |
| `var` | 是 | `undefined` | 否 |
| `function` | **是 (完全提升)** | 函数体本身 | 否 |
| `let` | 是 | *未初始化* | **是** |
| `const` | 是 | *未初始化* | **是** |
| `class` | 是 | *未初始化* | **是** |

**最佳实践：**
1.  **优先使用 `let` 和 `const`**：它们提供了块级作用域和暂时性死区，能帮助你编写更可预测、更不易出错的代码。
2.  **在作用域顶部声明所有变量和常量**：养成在使用前先声明的好习惯，这样可以使代码的意图更加清晰，避免因提升而导致的混乱。
3.  **理解函数声明和函数表达式的区别**：知道函数声明会被完整提升，而函数表达式遵循变量的提升规则，这对于组织代码结构至关重要。