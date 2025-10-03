---
title: Reflect
description: ""
publishDate: 2025-10-03
tags:
  - JavaScript
draft: false
---

`Reflect` 是 ES6 (ECMAScript 2015) 中引入的一个新的内置对象。它不是一个构造函数，你不能通过 `new Reflect()` 来创建实例。相反，它提供了一组静态方法，这些方法的名称和 `Proxy` 处理程序（handler）的方法名称完全相同。

## 为什么需要 Reflect？

在 `Reflect` 出现之前，一些“元编程”（meta-programming）的操作分散在不同的地方，比如：
*   `Object.defineProperty()`
*   `delete obj.prop`
*   `'prop' in obj`
*   `Object.keys()`

`Reflect` 的出现主要有三个目的：

1.  **将元编程操作集中化和函数化**：将之前属于不同语法（如 `delete`, `in` 操作符）或不同对象（如 `Object`）的内部方法，统一归属到 `Reflect` 对象上。这使得 API 更加清晰、一致。

2.  **提供更合理的返回值**：很多 `Object` 上的方法在执行失败时会抛出错误（`TypeError`），而 `Reflect` 对应的方法则返回 `false`。这使得你可以用 `if/else` 来处理逻辑，而不是必须使用 `try...catch`。

3.  **与 `Proxy` 完美配合**：`Proxy` 的处理程序（handler）可以拦截对象的基本操作。`Reflect` 的方法与 `Proxy` 的 `trap`（陷阱）方法一一对应。这使得在 `Proxy` 中调用原始操作变得非常简单和标准。

---

## `Reflect` 的常用方法和使用场景

`Reflect` 对象总共有 13 个静态方法，我们来详细介绍几个最常用和最有代表性的。

### 1. `Reflect.get(target, propertyKey[, receiver])`

**作用**：获取对象属性。等价于 `target[propertyKey]`。

**亮点**：`receiver` 参数。如果属性是一个 `getter`，`receiver` 可以指定 `getter` 内部的 `this`。

**示例 1：基本使用**

```javascript
const obj = { x: 1, y: 2 };

// 旧方式
console.log(obj.x); // 1

// 使用 Reflect
console.log(Reflect.get(obj, 'x')); // 1
```

**示例 2：`receiver` 的威力（与 Proxy 结合）**

```javascript
const user = {
  firstName: 'John',
  lastName: 'Doe',
  get fullName() {
    // 这里的 this 指向谁？
    return `${this.firstName} ${this.lastName}`;
  }
};

const proxy = new Proxy(user, {
  get(target, prop, receiver) {
    console.log(`正在读取属性: ${prop}`);
    // 如果不传 receiver，this 将指向原始的 target (user)
    // return Reflect.get(target, prop); 
  
    // 传递 receiver，this 将指向 proxy 实例
    // 这是推荐的做法，保证了操作的完整性
    return Reflect.get(target, prop, receiver);
  }
});

// 当我们访问 proxy.fullName 时...
// 1. Proxy 的 get 陷阱被触发 (prop = 'fullName')。
// 2. Reflect.get(target, 'fullName', receiver) 被调用。
// 3. 这会触发 user 对象的 fullName getter。
// 4. 因为我们传递了 receiver (proxy)，所以 getter 内部的 `this` 指向 `proxy`。
// 5. getter 内部会访问 `this.firstName` 和 `this.lastName`。
// 6. 这又会触发 Proxy 的 get 陷阱两次！
// 7. 最终返回 "John Doe"。

console.log(proxy.fullName);
// 输出:
// 正在读取属性: fullName
// 正在读取属性: firstName
// 正在读取属性: lastName
// John Doe
```

**小结**：在 `Proxy` 中，使用 `Reflect.get` 并传递 `receiver` 是确保 `this` 指向正确的标准做法。

---

### 2. `Reflect.set(target, propertyKey, value[, receiver])`

**作用**：设置对象属性。等价于 `target[propertyKey] = value`。

**亮点**：返回一个布尔值，表示设置是否成功。而直接赋值在严格模式下失败时会抛错。

**示例 1：更可靠的返回值**

```javascript
const obj = {};
// 冻结对象，使其属性不可写
Object.freeze(obj);

// 旧方式 (严格模式下会抛出 TypeError)
try {
  'use strict';
  obj.foo = 'bar'; // TypeError: Cannot add property foo, object is not extensible
} catch (e) {
  console.log('赋值失败:', e.message);
}

// 使用 Reflect
const success = Reflect.set(obj, 'foo', 'bar');
console.log('设置是否成功:', success); // false (不会抛出错误)
```

这个特性让你能用更优雅的方式处理操作失败的情况。

**示例 2：配合 `setter` 和 `receiver`**

```javascript
const user = {
    name: 'guest',
    set identity(value) {
        //这里的 this 指向 proxy，而不是 user
        this.name = value;
    }
};

const proxy = new Proxy(user, {
    set(target, prop, value, receiver) {
        console.log(`正在设置属性 ${prop}`);
        return Reflect.set(target, prop, value, receiver);
    }
});

proxy.identity = 'Admin';
// 输出: 正在设置属性 identity

// 因为 setter 内部的 this 指向 proxy，所以 this.name = value 也会触发 proxy 的 set
// 输出: 正在设置属性 name

console.log(user.name);    // Admin
console.log(proxy.name);   // Admin
```

---

### 3. `Reflect.has(target, propertyKey)`

**作用**：检查一个对象是否拥有某个属性。等价于 `in` 操作符。

**示例**

```javascript
const obj = { x: 1 };

// 旧方式
console.log('x' in obj); // true
console.log('y' in obj); // false

// 使用 Reflect
console.log(Reflect.has(obj, 'x')); // true
console.log(Reflect.has(obj, 'y')); // false
```

`Reflect.has` 将操作符函数化了。

---

### 4. `Reflect.defineProperty(target, propertyKey, attributes)`

**作用**：定义对象属性。基本等同于 `Object.defineProperty()`。

**亮点**：返回布尔值，而不是在失败时抛出错误。

**示例**

```javascript
const obj = {};

// 旧方式
try {
  // 第三个参数必须是属性描述符对象
  Object.defineProperty(obj, 'x', 'value'); // TypeError: 'value' is not a valid property descriptor.
} catch (e) {
  console.log('定义失败:', e.message);
}

// 使用 Reflect
const success = Reflect.defineProperty(obj, 'x', 'value');
console.log('定义是否成功:', success); // false
```

---

### 5. `Reflect.deleteProperty(target, propertyKey)`

**作用**：删除对象属性。等价于 `delete target[propertyKey]`。

**亮点**：返回布尔值，表示删除是否成功。

**示例**

```javascript
const obj = { x: 1 };
Object.freeze(obj); // 冻结后属性不可删除

// 旧方式 (非严格模式下静默失败，返回 false；严格模式下抛错)
console.log(delete obj.x); // false

// 使用 Reflect (总是返回布尔值)
const success = Reflect.deleteProperty(obj, 'x');
console.log('删除是否成功:', success); // false
```

---

### 6. `Reflect.apply(target, thisArgument, argumentsList)`

**作用**：调用一个函数。类似于 `Function.prototype.apply.call(target, ...)`。

**示例**

```javascript
function greet(prefix, suffix) {
  return prefix + this.name + suffix;
}

const user = { name: 'Alice' };

// 旧方式
console.log(greet.apply(user, ['Hello, ', '!'])); // "Hello, Alice!"
// 或者
console.log(Function.prototype.apply.call(greet, user, ['Hello, ', '!']));

// 使用 Reflect (更易读)
console.log(Reflect.apply(greet, user, ['Hello, ', '!'])); // "Hello, Alice!"
```

---

### 7. `Reflect.construct(target, argumentsList[, newTarget])`

**作用**：等价于 `new` 操作符，用于创建类的实例。

**亮点**：可以动态调用构造函数，并且可以指定新创建对象的原型。

**示例**

```javascript
class User {
  constructor(name) {
    this.name = name;
  }
}

// 旧方式
const user1 = new User('Bob');

// 使用 Reflect
const user2 = Reflect.construct(User, ['Charlie']);

console.log(user1.name); // Bob
console.log(user2.name); // Charlie

// newTarget 示例
class Person {
    constructor(name) {
        this.name = name;
    }
}

class Employee extends Person {
    constructor(name, title) {
        super(name);
        this.title = title;
    }
}

// 使用 Reflect.construct，用 Person 的构造函数，但创建 Employee 的实例
// newTarget 指定了实例的原型
const employee = Reflect.construct(Person, ['Dave'], Employee);

console.log(employee instanceof Person);    // true
console.log(employee instanceof Employee);  // true
console.log(employee.name);  // "Dave"
console.log(employee.title); // undefined (因为 Employee 的构造函数没被调用)
```

## 总结表格

| `Reflect` 方法                | 对应的旧操作                               | 主要优势                                         |
| ----------------------------- | ------------------------------------------ | ------------------------------------------------ |
| `Reflect.get(t, k, r)`        | `t[k]`                                     | 可指定 `getter` 的 `this` (`receiver`)           |
| `Reflect.set(t, k, v, r)`     | `t[k] = v`                                 | 返回布尔值，可指定 `setter` 的 `this` (`receiver`) |
| `Reflect.has(t, k)`           | `k in t`                                   | 函数化，API 一致                                 |
| `Reflect.defineProperty(t, k, d)` | `Object.defineProperty(t, k, d)`           | 返回布尔值，而非抛出错误                         |
| `Reflect.deleteProperty(t, k)`| `delete t[k]`                              | 返回布尔值，更可靠                               |
| `Reflect.apply(f, this, args)`| `f.apply(this, args)`                      | 语法更清晰，功能更纯粹                           |
| `Reflect.construct(t, args)`  | `new t(...args)`                           | 可以动态调用构造函数，可指定原型 (`newTarget`)     |
| `Reflect.ownKeys(t)`          | `Object.keys` + `Object.getOwnPropertySymbols` | 返回所有自有键（包括 Symbol 和不可枚举属性）     |

## 核心要点

-   **`Reflect` 不是用来替代 `Object` 的，而是为元编程提供一个更统一、更合理的 API 集合。**
-   **当你使用 `Proxy` 时，几乎总是应该在 `handler` 内部使用 `Reflect` 对应的方法来执行原始操作。** 这是为了确保所有内部语义（如 `this` 指向）都能被正确地传递和处理。
-   **把 `try...catch` 变为 `if/else`** 是 `Reflect` 在错误处理方面的一大进步，让代码逻辑更清晰。