---
title: js 深拷贝
description: 介绍深拷贝与浅拷贝的区别，并比较多种实现方式（JSON、structuredClone、Lodash、手写递归），各自优缺点与适用场景。
publishDate:  2025-09-11
tags:
  - JavaScript
draft: false
---

## 1. 深拷贝与浅拷贝的对比
| 特性 | 浅拷贝 (Shallow Copy) | 深拷贝 (Deep Copy) |
| :--- | :--- | :--- |
| **定义** | 只复制对象或数组的**第一层**属性。 | 递归复制对象或数组的**所有层级**的属性。 |
| **基本类型** | 复制**值**本身，创建独立副本。 | 复制**值**本身，创建独立副本。 |
| **引用类型** | 复制**内存地址引用**，新旧对象共享内部的引用类型数据。 | 创建一个全新的、内存地址完全独立的副本，包括所有内部的引用类型数据。 |
| **修改影响** | 修改新对象的**顶层属性**不影响原对象；修改**嵌套的引用类型属性**会影响原对象。 | 修改新对象的任何属性（包括嵌套属性）都**不会**影响原始对象。 |
| **举例** | `Object.assign()`, `[...arr]`, `{...obj}` | `structuredClone()`, `_.cloneDeep()`, 手动递归实现 |

---

## 2. 如何实现深拷贝？
有多种方法可以实现深拷贝，各有优缺点。
## 方法一：`JSON.parse(JSON.stringify(obj))`
这是最简单、最快捷的方法，但有诸多限制。
**工作原理**：将对象序列化成一个 JSON 字符串，然后再将这个字符串解析回一个新的 JavaScript 对象。

```JavaScript
const originalObj = {
  name: 'Alice',
  birthDate: new Date(),
  getInfo: function() { return this.name; },
  id: Symbol('id'),
  score: undefined
};
const deepCopiedObj = JSON.parse(JSON.stringify(originalObj));
console.log(deepCopiedObj);
/*
输出:
{
  "name": "Alice",
  "birthDate": "2023-10-27T10:00:00.000Z" // Date 对象变成了字符串
}
// getInfo, id, score 属性都丢失了！
*/
```

**优点 (Pros):**
- 非常简单，一行代码搞定。
- 能处理常见的 JSON 安全数据类型（对象、数组、字符串、数字、布尔值、`null`）。
**缺点/限制 (Cons/Limitations):**
- **会忽略** `**function**` **和** `**undefined**`：在序列化过程中，这些属性会直接被丢弃。
- **会忽略** `**Symbol**`：属性键或值为 `Symbol` 的项也会被丢弃。
- `**Date**` **对象会变成字符串**：失去了 `Date` 对象的特性。
- **无法处理循环引用**：如果对象内部有循环引用（例如 `a.b = a`），会抛出 `TypeError` 错误。
- `**RegExp**`**、**`**Error**` **对象会变成空对象** `**{}**`。
- `**NaN**`**、**`**Infinity**` **会变成** `**null**`。
- **无法拷贝对象的原型链**。

> 结论：只适用于数据结构简单、只包含 JSON 安全类型的数据。

---

## 方法二：`structuredClone()` (现代、推荐的方法)
这是 HTML5 规范中引入的一个新的全局函数，专门用于深拷贝。

```JavaScript
const originalObj = {
  name: 'Alice',
  birthDate: new Date(),
  regex: /ab+c/i,
  myMap: new Map([['key', 'value']]),
  mySet: new Set([1, 2, 3]),
  // 注意：函数仍然不能被克隆
  getInfo: function() { return this.name; }
};
try {
  const deepCopiedObj = structuredClone(originalObj);
  deepCopiedObj.myMap.set('key', 'newValue');
  console.log(originalObj.myMap.get('key')); // 输出: 'value' (原始对象未受影响)
  console.log(deepCopiedObj);
  /*
  输出一个包含 Date, RegExp, Map, Set 等对象的完整克隆
  但 getInfo 函数会因为无法被克隆而抛出错误
  */
} catch (e) {
  console.error(e); // DataCloneError: getInfo could not be cloned.
}
```

**如果去掉** `**getInfo**` **函数，**`**structuredClone**` **就会完美工作。**
**优点 (Pros):**
- **官方标准，原生支持**，无需引入第三方库。
- **功能强大**：支持 `Date`, `RegExp`, `Map`, `Set`, `Blob`, `File`, `ArrayBuffer` 等多种复杂类型。
- **支持循环引用**：能正确处理循环引用的对象。
- 性能比 `JSON` 方法和大多数手动实现的递归函数要好。
**缺点/限制 (Cons/Limitations):**
- **无法克隆函数 (**`**Function**`**)**：会抛出 `DataCloneError`。
- **无法克隆 DOM 节点**。
- **无法克隆原型链**：对象的 `__proto__` 和访问器属性（getter/setter）不会被保留。


> 结论：是目前绝大多数场景下的最佳选择。

---

## 方法三：使用第三方库 (如 Lodash)
像 Lodash 这样的库提供了经过严格测试、功能完备的深拷贝函数 `_.cloneDeep()`。
**安装**：
`npm install lodash` 或 `yarn add lodash`
**使用**：

```JavaScript
import _ from 'lodash';
// 或者 const _ = require('lodash');
const originalObj = {
  name: 'Alice',
  getInfo: function() { return this.name; },
  details: { age: 30 }
};
const deepCopiedObj = _.cloneDeep(originalObj);
deepCopiedObj.details.age = 99;
console.log(originalObj.details.age); // 输出: 30 (未受影响)
// Lodash 甚至可以克隆函数！
console.log(typeof deepCopiedObj.getInfo); // 输出: 'function'
```

**优点 (Pros):**
- **功能最全面**：几乎能处理所有 JavaScript 数据类型，包括函数和原型链。
- **稳定可靠**：经过了大量的测试，边缘情况处理得很好。
- **兼容性好**：可以在各种新旧环境中使用。
**缺点/限制 (Cons/Limitations):**
- **需要引入外部依赖**：增加了项目的体积。

> 结论：在需要兼容旧环境、处理极其复杂或包含函数的对象，或者项目中已经在使用 Lodash 时，这是最可靠的选择。

---

## 方法四：手动实现一个递归函数 (面试常考)
通过递归遍历对象的所有属性，手动创建一个深拷贝。这有助于深入理解深拷贝的原理。
这是一个**简化的实现**，用于演示思路：

```JavaScript
function deepCopy(obj, hash = new WeakMap()) {
  // 处理 null 和非对象类型
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  // 处理 Date 和 RegExp
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj);
  // 关键：处理循环引用
  // 如果已经拷贝过这个对象，直接返回缓存中的副本
  if (hash.has(obj)) {
    return hash.get(obj);
  }
  // 根据 obj 的类型（数组或对象）创建新的容器
  const copy = Array.isArray(obj) ? [] : {};
  // 将新创建的副本存入 hash 表
  hash.set(obj, copy);
  // 递归拷贝所有属性（使用 for...in 或 Reflect.ownKeys）
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      copy[key] = deepCopy(obj[key], hash);
    }
  }
  return copy;
}
// 示例
const obj1 = { a: 1, b: { c: 2 } };
obj1.d = obj1; // 制造循环引用
const obj2 = deepCopy(obj1);
obj2.b.c = 99;
console.log(obj1.b.c); // 输出: 2 (未受影响)
console.log(obj2.d === obj2); // 输出: true (循环引用被正确处理)
```

**优点 (Pros):**
- **灵活性高**：可以根据自己的需求定制拷贝逻辑。
- **无需任何依赖**。
- **面试加分项**：能写出这个表明你对 JS 核心概念理解很深。
**缺点/限制 (Cons/Limitations):**
- **实现复杂**：要考虑各种边界情况（循环引用、多种数据类型、原型链等），很容易出错。
- **性能通常不如原生方法或优化过的库**。

