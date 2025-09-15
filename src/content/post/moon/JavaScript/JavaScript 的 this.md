---
title: JavaScript 中的 this
description: ""
publishDate: 2025-09-15
tags:
  - JavaScript
draft: false
---


## 核心总结

`this` 是一个指向当前执行上下文中对象的引用。这个对象是在代码运行时动态绑定的。

---

## 规则一：默认绑定 - 作为普通函数调用

当一个函数被独立调用，而不是作为对象的方法时，`this` 的指向分为两种情况：

*   **非严格模式 (Sloppy Mode)**：`this` 指向全局对象（在浏览器中是 `window`，在 Node.js 中是 `global`）。
*   **严格模式 (Strict Mode)**：`this` 的值为 `undefined`。

```javascript
'use strict'; // 开启严格模式

function sayHello() {
  console.log(this);
}

sayHello(); // 非严格模式下输出: window 对象
           // 严格模式下输出: undefined
```

## 规则二：隐式绑定 - 作为对象的方法调用

当函数作为对象的一个属性（方法）被调用时，`this` 指向调用该方法的对象。

```javascript
const person = {
  name: 'Alice',
  greet: function() {
    // 这里的 this 指向 person 对象
    console.log('Hello, I am ' + this.name);
  }
};

person.greet(); // 输出: "Hello, I am Alice"
```

**⚠️ 陷阱：** 如果将方法赋给一个变量后再调用，就会变回“默认绑定”规则。

```javascript
const greetFunc = person.greet;
greetFunc(); // 严格模式下会报错 'Cannot read properties of undefined (reading 'name')'
             // 非严格模式下会输出 "Hello, I am " (因为 this.name 是 window.name，通常是 undefined)
```

## 规则三：显式绑定 - 使用 `call`, `apply`, `bind`

你可以强制改变函数执行时的 `this` 指向，这称为显式绑定。

1.  **`call()`** 和 **`apply()`**：
    * 立即调用函数。
    * 第一个参数是 `this` 要指向的对象。
    *   `call` 接收一个参数列表，`apply` 接收一个参数数组。

    ```javascript
    function introduce(city, country) {
      console.log(`My name is ${this.name}, I live in ${city}, ${country}.`);
    }

    const user = { name: 'Bob' };
    const anotherUser = { name: 'Charlie' };

    // 使用 call
    introduce.call(user, 'New York', 'USA'); // 输出: My name is Bob, I live in New York, USA.

    // 使用 apply
    introduce.apply(anotherUser, ['London', 'UK']); // 输出: My name is Charlie, I live in London, UK.
    ```

2.  **`bind()`**：
    *   **不立即调用函数**，而是创建一个新函数，这个新函数的 `this` 被永久绑定到 `bind` 的第一个参数。
    * 这在回调函数和事件处理中非常有用。

    ```javascript
    const user = { name: 'David' };

    function sayName() {
      console.log(this.name);
    }

    const boundSayName = sayName.bind(user);

    boundSayName(); // 输出: "David"

    // 即使在其他上下文中调用，this 也不会改变
    setTimeout(boundSayName, 100); // 100ms后依然输出: "David"
    ```

## 规则四：`new` 绑定 - 作为构造函数调用

当使用 `new` 关键字调用一个函数时（即作为构造函数），`this` 指向新创建的那个实例对象。

`new` 关键字会自动完成以下操作：
1.  创建一个全新的空对象。
2.  将这个新对象的 `this` 指向它。
3.  执行构造函数中的代码。
4.  隐式返回这个新对象（除非函数内部显式返回了另一个对象）。

```javascript
function Person(name, age) {
  // this 指向新创建的实例 (e.g., alice)
  this.name = name;
  this.age = age;
}

const alice = new Person('Alice', 30);
console.log(alice.name); // 输出: "Alice"
console.log(alice.age);  // 输出: 30
```

## 规则五：箭头函数 (`=>`) 的 `this` - 词法作用域

箭头函数是 ES6 的一个重要特性，它彻底改变了 `this` 的行为。

*   **箭头函数没有自己的 `this`。**
* 它会捕获其**定义时**所在的外层（词法）作用域的 `this` 值作为自己的 `this`。
* 一旦绑定，`call`, `apply`, `bind` 都无法再改变箭头函数的 `this` 指向。

这个特性主要解决了经典的回调函数中 `this` 丢失的问题。

**传统函数的问题：**

```javascript
const counter = {
  count: 0,
  start: function() {
    // 这里的 this 是 counter 对象
    setInterval(function() {
      // 这里的 this 是 window 或 undefined (默认绑定)
      // 所以 this.count 是 undefined
      this.count++;
      console.log(this.count); // 输出 NaN, NaN, ...
    }, 1000);
  }
};
// counter.start();
```

**箭头函数的解决方案：**

```javascript
const counter = {
  count: 0,
  start: function() {
    // 这里的 this 是 counter 对象
    setInterval(() => {
      // 箭头函数捕获了外层 start 方法的 this，所以 this 仍然是 counter 对象
      this.count++;
      console.log(this.count); // 输出 1, 2, 3, ...
    }, 1000);
  }
};

counter.start();
```

## 优先级总结

当多种规则同时适用时，`this` 的指向优先级如下：

1.  **`new` 绑定**：`new Person()`
2.  **显式绑定**：`func.call(obj)`
3.  **隐式绑定**：`obj.func()`
4.  **默认绑定**：`func()`

**箭头函数是例外**，它不适用以上规则，而是根据词法作用域来决定。