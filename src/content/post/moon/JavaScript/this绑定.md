---
title: this绑定
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

**⚠️ 陷阱：** 如果将方法赋给一个变量后再调用，就会变回“默认绑定”规则。当方法作为参数传递给另一个函数时，`this` 的绑定也会丢失。如果方法被用作回调函数，同样 this 绑定丢失。

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
* 词法作用域（也叫静态作用域）是 JavaScript 变量查找的基本规则。它意味着一个函数在定义时，就已经确定了它可以访问哪些外部变量。它的作用域链是基于它在代码中的物理位置（嵌套关系）来构建的。
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

## 规则优先级

当多种绑定规则同时适用时，JavaScript 按照以下优先级顺序来确定 `this` 的指向：

### 优先级排序

1. **`new` 绑定** （最高优先级）
2. **显式绑定** （`call`、`apply`、`bind`）
3. **隐式绑定** （对象方法调用）
4. **默认绑定** （最低优先级）

**⚠️ 特殊情况：** 箭头函数不遵循以上优先级规则，始终使用词法作用域的 `this`。

### 优先级验证示例

#### 1. `new` 绑定 vs 显式绑定

```javascript
function Person(name) {
  this.name = name;
}

const obj = { name: 'Object' };

// 显式绑定 + new 绑定
const BoundPerson = Person.bind(obj);
const instance = new BoundPerson('Instance'); // new 绑定优先

console.log(instance.name); // 输出: "Instance" (不是 "Object")
console.log(obj.name);      // 输出: undefined (obj 没有被修改)
```

#### 2. 显式绑定 vs 隐式绑定

```javascript
const obj1 = { 
  name: 'obj1',
  greet: function() {
    console.log(this.name);
  }
};

const obj2 = { name: 'obj2' };

// 隐式绑定
obj1.greet(); // 输出: "obj1"

// 显式绑定覆盖隐式绑定
obj1.greet.call(obj2); // 输出: "obj2" (显式绑定优先)
```

#### 3. 隐式绑定 vs 默认绑定

```javascript
const obj = {
  name: 'Object',
  greet: function() {
    console.log(this?.name || 'No name');
  }
};

// 隐式绑定
obj.greet(); // 输出: "Object"

// 赋值后失去隐式绑定，变成默认绑定
const greetFunc = obj.greet;
greetFunc(); // 输出: "No name" (严格模式下 this 是 undefined)
```

#### 4. 箭头函数的特殊性

```javascript
const obj = {
  name: 'Object',
  regularFunc: function() {
    console.log('Regular:', this.name);
  },
  arrowFunc: () => {
    console.log('Arrow:', this.name);
  },
  method: function() {
    const inner = () => {
      console.log('Inner arrow:', this.name);
    };
    inner();
  }
};

const another = { name: 'Another' };

// 常规函数遵循优先级规则
obj.regularFunc.call(another); // 输出: "Regular: Another"

// 箭头函数忽略显式绑定
obj.arrowFunc.call(another);   // 输出: "Arrow: undefined" (取决于外层作用域)

// 嵌套箭头函数继承外层 this
obj.method();                  // 输出: "Inner arrow: Object"
```

### 判断 `this` 指向的思维流程

遇到函数调用时，按以下顺序判断：

```javascript
function checkThis() {
  // 1. 是箭头函数吗？
  //    → 是：使用定义时的外层作用域 this
  //    → 否：继续下一步
  
  // 2. 使用 new 调用吗？
  //    → 是：this 指向新创建的实例
  //    → 否：继续下一步
  
  // 3. 使用 call/apply/bind 调用吗？
  //    → 是：this 指向传入的对象
  //    → 否：继续下一步
  
  // 4. 作为对象方法调用吗？
  //    → 是：this 指向调用的对象
  //    → 否：继续下一步
  
  // 5. 默认绑定
  //    → 严格模式：this 是 undefined
  //    → 非严格模式：this 是全局对象
}
```

### 常见陷阱与解决方案

#### 陷阱：方法作为回调函数

```javascript
const timer = {
  seconds: 0,
  start: function() {
    // 问题：this 绑定会丢失
    setInterval(this.tick, 1000); // this.tick 中的 this 是 window/undefined
  },
  tick: function() {
    this.seconds++;
    console.log(this.seconds);
  }
};

// 解决方案 1：使用 bind
const timer1 = {
  seconds: 0,
  start: function() {
    setInterval(this.tick.bind(this), 1000); // 显式绑定
  },
  tick: function() {
    this.seconds++;
    console.log(this.seconds);
  }
};

// 解决方案 2：使用箭头函数
const timer2 = {
  seconds: 0,
  start: function() {
    setInterval(() => this.tick(), 1000); // 箭头函数捕获外层 this
  },
  tick: function() {
    this.seconds++;
    console.log(this.seconds);
  }
};
```

**记忆要点：** 优先级从高到低是 `new` → `call/apply/bind` → `对象.方法()` → `独立调用()`，箭头函数是特例。

---

## 重要概念：方法不属于对象

在理解 `this` 绑定之前，需要明确一个重要概念：**JavaScript 中的方法并不真正"属于"对象，它们只是函数的引用。**

```javascript
function sayHello() {
  console.log(`Hello, I am ${this.name}`);
}

const person1 = { 
  name: 'Alice',
  greet: sayHello  // 只是对函数 sayHello 的引用
};

const person2 = { 
  name: 'Bob',
  greet: sayHello  // 同样是对函数 sayHello 的引用
};

// 同一个函数，不同的 this 绑定
person1.greet(); // 输出: "Hello, I am Alice"
person2.greet(); // 输出: "Hello, I am Bob"
```

### 关键理解

1. **函数是独立存在的**：`sayHello` 函数只有一个，但可以被多个对象引用。

2. **`this` 在调用时确定**：函数内部的 `this` 不是在定义时决定的，而是在调用时根据调用方式动态绑定的。

```javascript
const greet = function() {
  console.log(this.name);
};

// 同一个函数，三种不同的调用方式
const obj = { name: 'Object', method: greet };

greet();           // 独立调用：this 是 undefined/window
obj.method();      // 方法调用：this 是 obj
greet.call({name: 'Call'}); // 显式绑定：this 是传入的对象
```

1. **方法可以"脱离"对象**：这解释了为什么将方法赋值给变量后会失去 `this` 绑定。

```javascript
const person = {
  name: 'Alice',
  introduce: function() {
    console.log(`My name is ${this.name}`);
  }
};

// 方法调用 - this 指向 person
person.introduce(); // 输出: "My name is Alice"

// 函数引用赋值给变量 - 失去对象上下文
const func = person.introduce;
func(); // 输出: "My name is undefined" (严格模式下报错)
```

**这种设计的意义：** 函数的复用性和灵活性。同一个函数可以在不同的对象上下文中使用，`this` 机制让函数能够适应不同的调用环境。