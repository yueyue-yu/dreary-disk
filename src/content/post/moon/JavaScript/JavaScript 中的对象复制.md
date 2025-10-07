---
title: JavaScript 中的对象复制
description: ""
publishDate: 2025-10-05
tags:
  - JavaScript
draft: false
---



---

## 浅拷贝 (Shallow Copy)

浅拷贝创建一个新对象，但只复制第一层属性。如果属性值是引用类型，则只复制引用。

### 方法一：Object.assign()

```javascript
const original = {
  name: 'Alice',
  age: 25,
  address: {
    city: 'New York',
    country: 'USA'
  }
};

const shallowCopy = Object.assign({}, original);

// 修改第一层属性不会互相影响
shallowCopy.name = 'Bob';
console.log(original.name); // 输出: "Alice"

// 但修改嵌套对象会互相影响
shallowCopy.address.city = 'Los Angeles';
console.log(original.address.city); // 输出: "Los Angeles" (被修改了!)
```

### 方法二：展开语法 (Spread Operator)

```javascript
const original = {
  name: 'Alice',
  skills: ['JavaScript', 'Python']
};

const shallowCopy = { ...original };

// 第一层独立
shallowCopy.name = 'Bob';
console.log(original.name); // 输出: "Alice"

// 嵌套引用类型仍然共享
shallowCopy.skills.push('React');
console.log(original.skills); // 输出: ['JavaScript', 'Python', 'React']
```

### 方法三：Object.create() + Object.getOwnPropertyDescriptors()

```javascript
const original = { name: 'Alice', age: 25 };

// 保持属性描述符的浅拷贝
const shallowCopy = Object.create(
  Object.getPrototypeOf(original),
  Object.getOwnPropertyDescriptors(original)
);

console.log(shallowCopy.name); // 输出: "Alice"
console.log(original === shallowCopy); // false
```

### 数组的浅拷贝

```javascript
const originalArray = [1, { name: 'Alice' }, [2, 3]];

// 方法 1: 展开语法
const copy1 = [...originalArray];

// 方法 2: Array.from()
const copy2 = Array.from(originalArray);

// 方法 3: slice()
const copy3 = originalArray.slice();

// 都是浅拷贝：修改嵌套对象会互相影响
copy1[1].name = 'Bob';
console.log(originalArray[1].name); // 输出: "Bob"
```

---

## 深拷贝 (Deep Copy)

深拷贝创建一个完全独立的对象副本，包括所有嵌套的引用类型。

### 方法一：JSON.parse() + JSON.stringify() (有局限性)

```javascript
const original = {
  name: 'Alice',
  age: 25,
  address: {
    city: 'New York',
    details: {
      zipCode: '10001'
    }
  }
};

const deepCopy = JSON.parse(JSON.stringify(original));

// 修改嵌套对象不会互相影响
deepCopy.address.city = 'Los Angeles';
deepCopy.address.details.zipCode = '90210';

console.log(original.address.city); // 输出: "New York" (未被修改)
console.log(original.address.details.zipCode); // 输出: "10001" (未被修改)
```

**⚠️ JSON 方法的局限性：**

```javascript
const problematic = {
  func: function() { return 'hello'; },
  undef: undefined,
  sym: Symbol('test'),
  date: new Date(),
  regex: /abc/g,
  circular: null
};

// 创建循环引用
problematic.circular = problematic;

// JSON 方法的问题
try {
  const copy = JSON.parse(JSON.stringify(problematic));
  console.log(copy);
  // 输出: { date: "2025-10-05T...", regex: {} }
  // 丢失了: function, undefined, Symbol
} catch (error) {
  console.log('循环引用会报错:', error.message);
}
```

### 方法二：structuredClone() (推荐的现代方法) ✨

`structuredClone()` 是浏览器原生提供的深拷贝 API，专门用于复制复杂对象，解决了 JSON 方法的诸多局限性。

```javascript
const original = {
  name: 'Alice',
  age: 25,
  date: new Date(),
  regex: /test/gi,
  map: new Map([['key', 'value']]),
  set: new Set([1, 2, 3]),
  buffer: new ArrayBuffer(8),
  nested: {
    deep: {
      value: 'nested data'
    }
  }
};

// 添加循环引用
original.self = original;

// 使用 structuredClone
const deepCopy = structuredClone(original);

// 修改副本不影响原对象
deepCopy.nested.deep.value = 'modified';
deepCopy.map.set('key', 'new value');
deepCopy.set.add(4);

console.log(original.nested.deep.value); // 输出: "nested data" (未被修改)
console.log(original.map.get('key')); // 输出: "value" (未被修改)
console.log(original.set.has(4)); // 输出: false (未被修改)
console.log(deepCopy.self === deepCopy); // true (循环引用保持)
```

**✅ structuredClone 的优势：**

```javascript
const testObject = {
  // ✅ 支持日期对象
  date: new Date('2025-10-05'),
  
  // ✅ 支持正则表达式
  regex: /pattern/gi,
  
  // ✅ 支持 Map 和 Set
  map: new Map([['a', 1], ['b', 2]]),
  set: new Set([1, 2, 3]),
  
  // ✅ 支持 ArrayBuffer 和 TypedArray
  buffer: new ArrayBuffer(8),
  int8Array: new Int8Array([1, 2, 3]),
  
  // ✅ 支持 Blob 和 File (在浏览器中)
  // blob: new Blob(['content']),
  
  // ✅ 处理循环引用
  nested: {}
};

testObject.nested.parent = testObject;

const cloned = structuredClone(testObject);
console.log(cloned.date instanceof Date); // true
console.log(cloned.map instanceof Map); // true
console.log(cloned.set instanceof Set); // true
```

**⚠️ structuredClone 的局限性：**

```javascript
const unsupported = {
  // ❌ 不支持函数
  func: function() { return 'hello'; },
  
  // ❌ 不支持 Symbol
  sym: Symbol('test'),
  
  // ❌ 不支持 DOM 节点
  // element: document.getElementById('app'),
  
  // ❌ 不支持原型链（会丢失）
  // 只复制自有属性，不复制原型链上的属性
};

try {
  const cloned = structuredClone(unsupported);
  console.log(cloned); // { } - 函数和 Symbol 被忽略
} catch (error) {
  console.log('不支持的类型:', error.message);
}
```

**📊 与 JSON 方法对比：**

```javascript
const comparisonObject = {
  date: new Date('2025-10-05'),
  map: new Map([['key', 'value']]),
  set: new Set([1, 2, 3]),
  regex: /test/gi,
  undef: undefined,
  func: () => 'hello'
};

// JSON 方法
const jsonCopy = JSON.parse(JSON.stringify(comparisonObject));
console.log(jsonCopy);
// 输出: { date: "2025-10-05T...", map: {}, set: {}, regex: {} }
// 丢失: Map/Set 的数据, RegExp 的 flags, undefined, function

// structuredClone 方法
const structuredCopy = structuredClone(comparisonObject);
console.log(structuredCopy);
// 输出: { date: Date, map: Map, set: Set, regex: /test/gi }
// 保留: Date, Map, Set, RegExp 的完整功能
// 丢失: undefined, function (被忽略)
```

### 方法三：递归实现深拷贝

```javascript
function deepClone(obj, visited = new WeakMap()) {
  // 处理基本类型和 null
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // 处理循环引用
  if (visited.has(obj)) {
    return visited.get(obj);
  }
  
  // 处理 Date 对象
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  // 处理 RegExp 对象
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags);
  }
  
  // 处理数组
  if (Array.isArray(obj)) {
    const arrCopy = [];
    visited.set(obj, arrCopy);
    obj.forEach((item, index) => {
      arrCopy[index] = deepClone(item, visited);
    });
    return arrCopy;
  }
  
  // 处理普通对象
  const objCopy = {};
  visited.set(obj, objCopy);
  
  Object.keys(obj).forEach(key => {
    objCopy[key] = deepClone(obj[key], visited);
  });
  
  return objCopy;
}

// 测试递归深拷贝
const complex = {
  name: 'Alice',
  date: new Date(),
  regex: /test/gi,
  nested: {
    array: [1, 2, { deep: 'value' }]
  }
};

// 添加循环引用
complex.self = complex;

const cloned = deepClone(complex);
cloned.nested.array[2].deep = 'modified';

console.log(complex.nested.array[2].deep); // 输出: "value" (未被修改)
console.log(cloned.self === cloned); // true (循环引用保持)
```

### 方法四：使用第三方库

#### Lodash 的 cloneDeep

```javascript
// 需要引入 lodash
// const _ = require('lodash');

const original = {
  name: 'Alice',
  hobbies: ['reading', 'coding'],
  address: {
    city: 'New York'
  }
};

// const deepCopy = _.cloneDeep(original);
```


---



## 总结


### 深拷贝方法对比

| 特性 | structuredClone | JSON 方法 | 递归实现 | Lodash |
|------|----------------|-----------|----------|--------|
| Date 对象 | ✅ | ❌ (转字符串) | ✅ | ✅ |
| RegExp | ✅ | ❌ (丢失 flags) | ✅ | ✅ |
| Map/Set | ✅ | ❌ (变空对象) | 需手动实现 | ✅ |
| ArrayBuffer | ✅ | ❌ | 需手动实现 | ✅ |
| 循环引用 | ✅ | ❌ (报错) | ✅ | ✅ |
| 函数 | ❌ | ❌ | ❌ | ✅ (浅拷贝) |
| Symbol | ❌ | ❌ | 可实现 | ✅ |
| 性能 | 快 | 中等 | 较慢 | 中等 |
| 浏览器支持 | 现代浏览器 | 全部 | 全部 | 需引入 |

