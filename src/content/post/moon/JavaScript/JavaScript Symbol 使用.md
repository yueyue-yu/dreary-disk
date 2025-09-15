---
title: JavaScript Symbol 使用
description: ""
publishDate:  2025-09-15
tags:
  - JavaScript
draft: false
---


## 1. 定义与特性
`Symbol` 是 ES6 引入的第七种原始数据类型。核心特性是 **创建唯一且不可变的值**。

```javascript
const s1 = Symbol();
const s2 = Symbol('debug'); // 'debug' 仅为描述，不影响唯一性
const s3 = Symbol('debug');

s1 === s2; // false
s2 === s3; // false
```

## 2. 主要用途：唯一的属性名
用作对象属性名，以避免命名冲突，特别是用于向现有对象添加新行为或元数据时。

```javascript
const id = Symbol('id');
const user = {
  name: 'John',
  [id]: 123 // 必须使用方括号语法
};

console.log(user[id]); // 123
```

## 3. “隐藏”与遍历
Symbol 作为属性名时，常规的属性遍历方法会忽略它。

- `for...in` 循环：**跳过** Symbol 属性。
- `Object.keys()`：**忽略** Symbol 属性。
- `Object.getOwnPropertyNames()`：**忽略** Symbol 属性。
- `JSON.stringify()`：**忽略** Symbol 属性。

要访问 Symbol 属性，需使用专门的方法：
- `Object.getOwnPropertySymbols(obj)`：返回一个只包含 Symbol 属性名的数组。
- `Reflect.ownKeys(obj)`：返回所有属性名（包括字符串和 Symbol）。

```javascript
const obj = {
  [Symbol('a')]: 'a',
  b: 'b'
};

Object.keys(obj);                  // ['b']
Object.getOwnPropertySymbols(obj); // [Symbol(a)]
Reflect.ownKeys(obj);              // ['b', Symbol(a)]
```

## 4. 全局共享 Symbol
如果希望在不同作用域或代码文件中复用同一个 Symbol，可使用全局 Symbol 注册表。

- `Symbol.for(key)`：根据 `key` 在全局查找 Symbol。如果存在，则返回它；否则，创建一个新的 Symbol 并注册到全局。
- `Symbol.keyFor(symbol)`：获取一个已注册在全局的 Symbol 的 `key`。

```javascript
const gs1 = Symbol.for('global_id');
const gs2 = Symbol.for('global_id');

gs1 === gs2; // true

Symbol.keyFor(gs1); // 'global_id'
```

## 5.Well-Known Symbols
内置的（Well-Known Symbols）允许开发者通过它们来覆盖或挂载 JavaScript 的内部语言行为。

- `Symbol.iterator`：使对象支持 `for...of` 循环。
- `Symbol.hasInstance`：自定义 `instanceof` 的行为。
- `Symbol.toStringTag`：自定义 `Object.prototype.toString.call()` 返回的字符串。
- `Symbol.asyncIterator`：使对象支持 `for await...of`。

```javascript
class MyCollection {
  *[Symbol.iterator]() {
    yield 1;
    yield 2;
  }
}

const collection = new MyCollection();
for (const item of collection) {
  console.log(item); // 依次输出 1, 2
}
```