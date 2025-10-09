---
title: JavaScript 对象不变性
description: ""
publishDate: 2025-10-05
tags:
  - JavaScript
draft: false
---


## 什么是对象不变性？

对象不变性（Immutability）是指对象一旦被创建，其状态就不能被改变。在 JavaScript 中，默认情况下对象是可变的（mutable），但我们可以通过多种方式来实现不变性。

## 为什么需要不变性？

1. **可预测性**：不可变对象的状态不会改变，代码行为更容易预测
2. **调试简单**：减少副作用，更容易追踪数据变化
3. **性能优化**：特别是在 React 等框架中，不变性使得变化检测更高效
4. **并发安全**：不可变数据天然线程安全
5. **时间旅行**：便于实现撤销/重做功能

## 实现对象不变性的方法

### 1. Object.freeze()

`Object.freeze()` 冻结一个对象，使其属性不可修改、删除或添加。

```javascript
const person = {
  name: 'Alice',
  age: 25
};

Object.freeze(person);

person.age = 30;        // 静默失败（严格模式下会报错）
person.city = 'Beijing'; // 静默失败
delete person.name;     // 静默失败

console.log(person);    // { name: 'Alice', age: 25 }
```

**局限性**：只能冻结对象的第一层（浅冻结）

```javascript
const user = {
  name: 'Bob',
  address: {
    city: 'Shanghai'
  }
};

Object.freeze(user);

user.name = 'Charlie';           // 失败
user.address.city = 'Beijing';   // 成功！嵌套对象未被冻结

console.log(user.address.city);  // 'Beijing'
```

### 2. Object.seal()

`Object.seal()` 封闭一个对象，防止添加新属性和删除现有属性，但允许修改现有属性的值。

```javascript
const product = {
  name: 'Laptop',
  price: 5000
};

Object.seal(product);

product.price = 4500;      // ✓ 允许修改
product.brand = 'Dell';    // ✗ 不允许添加
delete product.name;       // ✗ 不允许删除

console.log(product);      // { name: 'Laptop', price: 4500 }
```

### 3. Object.preventExtensions()

`Object.preventExtensions()` 防止对象添加新属性，但允许修改和删除现有属性。

```javascript
const config = {
  theme: 'dark',
  language: 'zh-CN'
};

Object.preventExtensions(config);

config.theme = 'light';       // ✓ 允许修改
delete config.language;       // ✓ 允许删除
config.version = '1.0';       // ✗ 不允许添加

console.log(config);          // { theme: 'light' }
```

### 4. 深度冻结（Deep Freeze）

手动实现深度冻结，递归冻结所有嵌套对象：

```javascript
function deepFreeze(obj) {
  // 获取对象的所有属性名
  const propNames = Object.getOwnPropertyNames(obj);
  
  // 在冻结自身之前先冻结属性
  for (const name of propNames) {
    const value = obj[name];
    
    // 如果属性值是对象，递归冻结
    if (value && typeof value === 'object') {
      deepFreeze(value);
    }
  }
  
  return Object.freeze(obj);
}

// 使用示例
const data = {
  name: 'Test',
  nested: {
    value: 42,
    deep: {
      item: 'frozen'
    }
  }
};

deepFreeze(data);

data.nested.deep.item = 'changed';  // 失败
console.log(data.nested.deep.item); // 'frozen'
```

### 5. 使用扩展运算符创建新对象

通过创建副本而不是修改原对象来实现不变性：

```javascript
const original = { a: 1, b: 2 };

// 浅拷贝
const updated = { ...original, b: 3 };

console.log(original); // { a: 1, b: 2 }
console.log(updated);  // { a: 1, b: 3 }
```

**处理嵌套对象**：

```javascript
const state = {
  user: {
    name: 'Alice',
    settings: {
      theme: 'dark'
    }
  }
};

// 更新嵌套属性
const newState = {
  ...state,
  user: {
    ...state.user,
    settings: {
      ...state.user.settings,
      theme: 'light'
    }
  }
};

console.log(state.user.settings.theme);    // 'dark'
console.log(newState.user.settings.theme); // 'light'
```

### 6. 使用库实现不变性

#### Immer

Immer 让你以可变的方式编写代码，但产生不可变的结果：

```javascript
import { produce } from 'immer';

const baseState = {
  list: [
    { id: 1, title: 'Task 1', done: false },
    { id: 2, title: 'Task 2', done: false }
  ]
};

const nextState = produce(baseState, draft => {
  draft.list[0].done = true;
  draft.list.push({ id: 3, title: 'Task 3', done: false });
});

console.log(baseState.list.length);  // 2
console.log(nextState.list.length);  // 3
console.log(baseState === nextState); // false
```

#### Immutable.js

Facebook 的 Immutable.js 提供了持久化的不可变数据结构：

```javascript
import { Map, List } from 'immutable';

const map1 = Map({ a: 1, b: 2, c: 3 });
const map2 = map1.set('b', 50);

console.log(map1.get('b')); // 2
console.log(map2.get('b')); // 50

const list1 = List([1, 2, 3]);
const list2 = list1.push(4);

console.log(list1.size); // 3
console.log(list2.size); // 4
```

## 数组的不变性操作

### 避免使用的可变方法

```javascript
const arr = [1, 2, 3];

// ✗ 这些方法会修改原数组
arr.push(4);       // 添加
arr.pop();         // 删除
arr.shift();       // 删除
arr.unshift(0);    // 添加
arr.splice(1, 1);  // 删除/替换
arr.sort();        // 排序
arr.reverse();     // 反转
```

### 推荐的不可变方法

```javascript
const arr = [1, 2, 3];

// ✓ 这些操作返回新数组
const added = [...arr, 4];              // [1, 2, 3, 4]
const removed = arr.filter(x => x !== 2); // [1, 3]
const mapped = arr.map(x => x * 2);     // [2, 4, 6]
const sliced = arr.slice(1, 3);         // [2, 3]
const concatenated = arr.concat([4, 5]); // [1, 2, 3, 4, 5]

// 替换元素
const index = 1;
const replaced = [
  ...arr.slice(0, index),
  99,
  ...arr.slice(index + 1)
]; // [1, 99, 3]

// 插入元素
const inserted = [
  ...arr.slice(0, index),
  99,
  ...arr.slice(index)
]; // [1, 99, 2, 3]
```

## 检查对象的不变性状态

```javascript
const obj = { name: 'Test' };

// 检查是否被冻结
console.log(Object.isFrozen(obj));      // false

// 检查是否被封闭
console.log(Object.isSealed(obj));      // false

// 检查是否可扩展
console.log(Object.isExtensible(obj));  // true

Object.freeze(obj);

console.log(Object.isFrozen(obj));      // true
console.log(Object.isSealed(obj));      // true（冻结的对象也是封闭的）
console.log(Object.isExtensible(obj));  // false（冻结的对象不可扩展）
```

## 在 React 中的应用

不变性是 React 状态管理的核心原则：

```javascript
// ✗ 错误：直接修改状态
const [items, setItems] = useState([1, 2, 3]);
items.push(4);  // 不会触发重新渲染
setItems(items);

// ✓ 正确：创建新数组
setItems([...items, 4]);

// ✗ 错误：修改嵌套对象
const [user, setUser] = useState({
  name: 'Alice',
  address: { city: 'Shanghai' }
});
user.address.city = 'Beijing';  // 不会触发重新渲染
setUser(user);

// ✓ 正确：创建新对象
setUser({
  ...user,
  address: {
    ...user.address,
    city: 'Beijing'
  }
});
```

## 性能考虑

### 优点

1. **浅比较高效**：只需比较引用，不需要深度比较
2. **记忆化（Memoization）**：便于缓存计算结果
3. **变化追踪**：React.memo、useMemo 等依赖不变性

### 缺点

1. **内存开销**：每次更新都创建新对象
2. **学习曲线**：需要改变编程习惯
3. **深拷贝成本**：大对象的复制可能影响性能

### 优化策略

```javascript
// 使用结构共享（Structural Sharing）
// Immer 和 Immutable.js 自动实现了这一点

// 只复制变化的部分
const updateUserCity = (state, city) => ({
  ...state,
  user: {
    ...state.user,
    address: {
      ...state.user.address,
      city  // 只有这条路径上的对象被复制
    }
  }
});
```

## 最佳实践

1. **默认使用不可变方式**：养成创建新对象而不是修改的习惯
2. **在边界使用 freeze**：在开发环境中冻结状态对象，帮助发现意外修改
3. **选择合适的工具**：
   - 简单场景：扩展运算符
   - 复杂状态：Immer
   - 大规模应用：Immutable.js
4. **避免过度优化**：不是所有场景都需要严格的不变性
5. **类型检查**：使用 TypeScript 的 `Readonly<T>` 类型

```typescript
interface User {
  readonly name: string;
  readonly age: number;
}

const user: Readonly<User> = {
  name: 'Alice',
  age: 25
};

// user.age = 30; // 编译错误
```

## 总结

对象不变性是现代 JavaScript 开发的重要概念，特别是在 React、Redux 等框架中。通过：

- 使用 `Object.freeze()`、`Object.seal()` 等内置方法
- 采用扩展运算符创建新对象
- 利用 Immer、Immutable.js 等库
- 遵循不可变的数组操作模式

我们可以编写更可预测、更易维护、性能更好的应用程序。关键是在代码质量和性能之间找到平衡点。
