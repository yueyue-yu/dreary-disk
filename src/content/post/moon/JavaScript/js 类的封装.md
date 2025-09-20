---
title: js 类的封装
description: ""
publishDate:  2025-09-20
tags: []
draft: false
---

在 JavaScript 中，封装是面向对象编程的核心概念之一，它允许我们隐藏对象内部的实现细节，只暴露必要的接口。私有（private）和受保护（protected）的属性和方法是实现封装的重要方式。然而，JavaScript 对这些概念的支持与其他传统的面向对象语言（如 Java 或 C++）有所不同。

## 1. 私有 (Private) 属性和方法

私有成员意味着它们只能在定义它们的类或对象内部被访问。

### 传统方式：下划线 `_` 前缀 (约定)

在 ES6 的 `class` 语法和更早的构造函数模式中，开发者们约定俗成地使用下划线 `_` 作为前缀来表示一个属性或方法是“私有的”。

- **工作原理**: 这仅仅是一种命名约定，用于告诉其他开发者：“这是一个内部成员，请不要在外部直接访问或修改它。”
- **缺点**: 这种方式并不能真正阻止外部访问，它只是一种“君子协定”，代码在技术上仍然可以从外部访问这些成员。

**示例:**

```javascript
class CoffeeMachine {
  constructor(power) {
    this._power = power; // _power 是一个“私有”属性
  }

  _heat() { // _heat 是一个“私有”方法
    console.log('Heating water...');
  }

  makeCoffee() {
    this._heat();
    console.log('Coffee is ready!');
  }
}

let coffeeMachine = new CoffeeMachine(100);
coffeeMachine.makeCoffee(); // 正确使用公有方法

// 尽管不推荐，但从外部依然可以访问
console.log(coffeeMachine._power); // 输出: 100
coffeeMachine._heat();             // 输出: 'Heating water...'
```

### 现代方式：`#` 哈希前缀 (真正的私有)

从 ECMAScript 2022 (ES13) 开始，JavaScript `class` 引入了真正的私有成员语法，使用哈希符号 `#` 作为前缀。

- **工作原理**: 使用 `#` 声明的属性或方法是真正的私有成员。如果在类的外部尝试访问或调用它们，JavaScript 引擎会抛出一个 `SyntaxError` 或 `TypeError`。
- **优点**: 提供了语言级别的强制私有性，确保了类的封装性。

**示例:**

```javascript
class CoffeeMachine {
  #waterLimit = 200; // 私有字段

  #checkWater() { // 私有方法
    if (this.#waterLimit < 50) {
      console.log('Water level is too low!');
      return false;
    }
    return true;
  }

  makeCoffee() {
    if (this.#checkWater()) {
      console.log('Making coffee...');
      this.#waterLimit -= 50;
    }
  }
}

let machine = new CoffeeMachine();
machine.makeCoffee(); // 输出: 'Making coffee...'

// 尝试从外部访问会报错
// console.log(machine.#waterLimit); // 抛出 SyntaxError
// machine.#checkWater();           // 抛出 SyntaxError
```

## 2. 受保护 (Protected) 属性和方法

受保护成员意味着它们除了可以在自身类中被访问外，还可以在其子类（继承的类）中被访问，但不能在类的外部被访问。

**JavaScript 中没有原生的 `protected` 关键字。**

实现“受保护”成员最常见的方式仍然是使用 **下划线 `_` 前缀** 的约定。这个约定不仅用于表示“私有”，更多时候是用于表示“受保护”的意图，即这个成员是为子类扩展或内部使用而设计的，不应该被外部实例直接调用。

**示例:**

```javascript
class Machine {
  constructor(name) {
    this._name = name; // “受保护”的属性
  }

  _start() { // “受保护”的方法
    console.log(`${this._name} is starting...`);
  }
}

class CoffeeMachine extends Machine {
  makeCoffee() {
    // 可以在子类中访问父类的“受保护”成员
    this._start();
    console.log('Coffee is brewing.');
  }
}

let coffeeMachine = new CoffeeMachine('My Coffee Machine');
coffeeMachine.makeCoffee();
// 输出:
// My Coffee Machine is starting...
// Coffee is brewing.

// 同样的，这种方式并不能阻止外部访问
console.log(coffeeMachine._name); // 输出: 'My Coffee Machine'
```

## 总结

| 可见性     | 语法/约定        | 描述                                                                                                      |
| ---------- | ---------------- | --------------------------------------------------------------------------------------------------------- |
| **公有 (Public)** | 默认             | 可以在任何地方被访问。                                                                                    |
| **私有 (Private)** | `#` 前缀 (现代)  | **真正的私有**。只能在类内部访问，外部和子类都无法访问。这是实现封装的首选方式。                        |
| **" 伪私有 "** | `_` 前缀 (约定)  | **一种命名约定**。用于提示该成员不应在外部使用，但技术上并无限制。                                          |
| **" 受保护 "** | `_` 前缀 (约定)  | **一种命名约定**。用于提示该成员供类本身及其子类使用，但不应在外部使用。JavaScript 没有原生的 `protected` 支持。 |
好的，在 JavaScript 中实现对属性的可读（get）和可写（set）控制，主要是通过 **访问器属性（Accessor Properties）**，也就是我们常说的 **getter** 和 **setter** 来实现的。

这允许你“拦截”对属性的读取和写入操作，从而加入自定义的逻辑，例如数据验证、格式化、或者触发其他事件。这与我们刚刚讨论的私有/受保护属性（通常作为 *后端存储*）完美结合。

### 核心思想：后端字段 (Backing Field)

为了避免无限循环，你不应该在 getter 或 setter 内部直接操作同名属性。例如，下面的代码会造成死循环：

```javascript
class User {
  // 错误示范！会造成无限递归
  set name(value) {
    this.name = value; // 这里调用了 set name()，导致无限循环
  }
}
```

正确的做法是，使用一个 **独立的、通常是私有的属性** 来存储实际的值。这个私有属性被称为 **后端字段 (Backing Field)**。而 getter 和 setter 则作为公共接口，来操作这个后端字段。

下面我们结合 `_` (约定) 和 `#` (真私有) 两种方式来演示。

### 1. 使用 `_` (约定) 作为后端字段

这是在 ES6 `class` 中最常见的方式，易于理解。

```javascript
class User {
  constructor(name) {
    // _name 是实际存储数据的后端字段
    this._name = name; 
  }

  // Getter: 用于读取属性
  // 当你访问 user.name 时，这个方法会被调用
  get name() {
    console.log('正在读取 name...');
    return this._name;
  }

  // Setter: 用于写入属性
  // 当你执行 user.name = 'new value' 时，这个方法会被调用
  set name(value) {
    console.log('正在写入 name...');
    if (value && value.length > 0) {
      this._name = value; // 验证通过后，更新后端字段
    } else {
      console.error('名字不能为空！');
    }
  }
}

let user = new User('Alice');

// 读取属性（触发 getter）
console.log(user.name); 
// 输出:
// 正在读取 name...
// Alice

// 写入属性（触发 setter）
user.name = 'Bob'; 
console.log(user.name);
// 输出:
// 正在写入 name...
// 正在读取 name...
// Bob

// 尝试写入无效值（触发 setter 的验证逻辑）
user.name = ''; 
console.log(user.name);
// 输出:
// 正在写入 name...
// 名字不能为空！
// 正在读取 name...
// Bob (值没有被改变)
```

### 2. 使用 `#` (真私有) 作为后端字段 (推荐的现代方式)

使用私有字段 `#` 可以提供更强的封装性，确保后端字段不会从外部被意外修改。

```javascript
class SecureUser {
  // #name 是一个真正的私有字段，作为后端存储
  #name;

  constructor(name) {
    // 在构造函数内部，可以通过 this.#name 访问
    this.#name = name;
  }

  // 公共的 getter，用于读取 #name
  get name() {
    return this.#name;
  }

  // 公共的 setter，用于验证并写入 #name
  set name(value) {
    if (value && value.trim().length > 0) {
      this.#name = value;
    } else {
      console.error('名字不能为空！');
    }
  }
}

let secureUser = new SecureUser('Charlie');

// 读取，通过公共 getter
console.log(secureUser.name); // 输出: Charlie

// 写入，通过公共 setter
secureUser.name = 'David';
console.log(secureUser.name); // 输出: David

// 尝试从外部直接访问私有字段，会报错
// console.log(secureUser.#name); // SyntaxError: Private field '#name' must be declared in an enclosing class
```

### 控制只读或只写

通过只提供 getter 或 setter，你可以轻松实现只读或只写的属性。

#### 只读 (Read-Only) 属性

只提供 `get` 方法，不提供 `set` 方法。

```javascript
class Circle {
  #radius;

  constructor(radius) {
    this.#radius = radius;
  }

  // area 是一个只读的计算属性
  get area() {
    return Math.PI * this.#radius * this.#radius;
  }
}

const c = new Circle(10);
console.log(c.area); // 输出: 314.159...

// 尝试写入只读属性
c.area = 100; // 在非严格模式下，这个操作会被静默忽略；在严格模式下会报错。
console.log(c.area); // 仍然输出 314.159...
```

#### 只写 (Write-Only) 属性

只提供 `set` 方法，不提供 `get` 方法。这种场景比较少见，但可以用于例如设置一个一次性的密钥或密码。

```javascript
class TemporaryPassword {
    #password;

    // 只写
    set password(p) {
        if(p.length >= 8) {
            this.#password = `hashed_${p}`;
            console.log('密码已设置（并已哈希处理）');
        } else {
            console.log('密码太短');
        }
    }
}

let pwd = new TemporaryPassword();
pwd.password = 'mysecret123'; // 输出: 密码已设置（并已哈希处理）

// 尝试读取，会返回 undefined，因为没有 getter
console.log(pwd.password); // 输出: undefined
```

### 总结

| 控制类型     | 实现方式                                                     | 示例 (使用 `#` 后端字段)                               |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------ |
| **可读可写** | 提供 `get` 和 `set`                                          | `get name() { return this.#name; }`<br>`set name(val) { this.#name = val; }` |
| **只读**     | 只提供 `get`                                                 | `get name() { return this.#name; }`                     |
| **只写**     | 只提供 `set`                                                 | `set name(val) { this.#name = val; }`                  |
| **直接访问** | 不使用 getter/setter，直接暴露公共字段（不推荐用于需要控制的场景） | `constructor() { this.name = '...'; }`                   |