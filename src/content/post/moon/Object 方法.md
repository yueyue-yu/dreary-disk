---
title: Object 方法
description: ""
publishDate:  2025-09-20
tags:
  - JavaScript
draft: false
---

---

## `Object` 的方法分类

`Object` 的方法主要分为两大类：

1.  **`Object` 构造函数自身的静态方法**：这些方法**直接定义在 `Object` 构造函数上**，通过 `Object.methodName()` 的形式调用。它们通常作用于任意对象，或用于创建、操作对象。
2.  **`Object.prototype` 上的实例方法**：这些方法定义在 `Object` 的原型（`Object.prototype`）上。**几乎所有 JavaScript 对象**（除了那些通过 `Object.create(null)` 创建的特殊对象）都会继承这些方法，因此可以直接在对象实例上调用，如 `myObj.toString()`。

---

### 1. `Object` 的静态方法（`Object.methodName()`）

这些是日常开发中非常频繁使用的工具方法。

#### 对象创建与操作

1.  **`Object.create(proto, [propertiesObject])`**
    *   **作用**：创建一个新对象，并使用现有的对象来作为新创建对象的原型 (`__proto__`)。这是实现原型式继承的核心方法。
    *   **示例**:

        ```javascript
        const person = {
          greet: function() {
            console.log(`Hello, I'm ${this.name}`);
          }
        };

        // 创建一个新对象 me，其原型是 person
        const me = Object.create(person);
        me.name = "Alice"; // me 自身属性
        me.greet(); // "Hello, I'm Alice" (从原型 person 上继承的方法)

        console.log(me.isPrototypeOf(person)); // false
        console.log(person.isPrototypeOf(me)); // true
        ```

2.  **`Object.assign(target, ...sources)`**
    *   **作用**：将一个或多个源对象 (`sources`) 的所有**可枚举的、自有**属性复制到目标对象 (`target`)。它返回修改后的目标对象。常用于**对象合并**或**浅拷贝**。
    *   **示例**:

        ```javascript
        const target = { a: 1, b: 2 };
        const source1 = { b: 3, c: 4 };
        const source2 = { d: 5 };

        const returnedTarget = Object.assign(target, source1, source2);

        console.log(target); // { a: 1, b: 3, c: 4, d: 5 } (注意 b 被覆盖)
        console.log(returnedTarget === target); // true

        // 浅拷贝示例
        const original = { a: 1, b: { x: 10 } };
        const copy = Object.assign({}, original);
        copy.a = 2; // 修改基本类型，不影响原对象
        copy.b.x = 20; // 修改嵌套对象，会影响原对象（浅拷贝）
        console.log(original); // { a: 1, b: { x: 20 } }
        ```

3.  **`Object.defineProperty(obj, prop, descriptor)`**
    *   **作用**：在一个对象上**定义一个新属性**，或**修改一个现有属性**，并返回这个对象。这是进行**精细属性控制**的强大方法。
    *   **描述符 (`descriptor`)**:
        *   `value`: 属性的值。
        *   `writable`: 如果为 `true`，属性的值（`value`）才能被赋值运算符改变。
        *   `get`: 属性的 getter 函数，当访问该属性时调用。
        *   `set`: 属性的 setter 函数，当属性值被修改时调用。
        *   `configurable`: 如果为 `true`，属性的描述符才能够被改变，同时该属性也能从对应的对象上被删除。
        *   `enumerable`: 如果为 `true`，属性才会出现在对象的枚举属性中（如 `for...in` 循环）。
    *   **示例**:

        ```javascript
        const obj = {};
        Object.defineProperty(obj, 'myProperty', {
          value: 42,
          writable: false, // 只读
          enumerable: true, // 可枚举
          configurable: false // 不可再配置或删除
        });

        console.log(obj.myProperty); // 42
        obj.myProperty = 100; // 严格模式下会报错
        console.log(obj.myProperty); // 依然是 42
        ```

#### 对象属性访问与遍历

4.  **`Object.keys(obj)`**
    *   **作用**：返回一个由一个给定对象的**自身可枚举**属性组成的**数组**，数组中属性名的排列顺序和正常循环遍历该对象时返回的顺序一致。
    *   **示例**:

        ```javascript
        const user = { id: 1, name: "Bob", age: 30 };
        console.log(Object.keys(user)); // ["id", "name", "age"]
        ```

5.  **`Object.values(obj)`**
    *   **作用**：返回一个给定对象**自身可枚举**属性值的**数组**。
    *   **示例**:

        ```javascript
        const user = { id: 1, name: "Bob", age: 30 };
        console.log(Object.values(user)); // [1, "Bob", 30]
        ```

6.  **`Object.entries(obj)`**
    *   **作用**：返回一个给定对象**自身可枚举**属性的键值对数组。非常适合与 `Map` 或 `for...of` 循环一起使用。
    *   **示例**:

        ```javascript
        const user = { id: 1, name: "Bob", age: 30 };
        console.log(Object.entries(user)); // [["id", 1], ["name", "Bob"], ["age", 30]]

        // 转换为 Map
        const userMap = new Map(Object.entries(user));
        console.log(userMap.get("name")); // "Bob"

        // 遍历对象
        for (const [key, value] of Object.entries(user)) {
          console.log(`${key}: ${value}`);
        }
        ```

#### 对象属性描述符与原型

7.  **`Object.getOwnPropertyDescriptor(obj, prop)`**
    *   **作用**：获取一个对象**自有属性**的属性描述符。
    *   **示例**:

        ```javascript
        const o = { a: 1 };
        console.log(Object.getOwnPropertyDescriptor(o, 'a'));
        // { value: 1, writable: true, enumerable: true, configurable: true }
        ```

8.  **`Object.getPrototypeOf(obj)`**
    *   **作用**：返回指定对象的**原型**（内部 `[[Prototype]]` 属性的值）。这是获取对象原型的标准方法，比直接访问 `__proto__` 属性更推荐。
    *   **示例**:

        ```javascript
        const arr = [];
        console.log(Object.getPrototypeOf(arr) === Array.prototype); // true
        console.log(Object.getPrototypeOf(arr) === Object.prototype); // false
        ```

#### 对象状态与类型检查

9.  **`Object.freeze(obj)`**
    *   **作用**：**冻结**一个对象。冻结后的对象不能被修改；不能添加新属性，不能删除已有属性，不能修改已有属性的值、可枚举性、可配置性或可写性。返回被冻结的对象。
    *   **示例**:

        ```javascript
        const frozenObj = { prop: 42 };
        Object.freeze(frozenObj);
        frozenObj.prop = 33; // 静默失败 (或严格模式下报错)
        frozenObj.newProp = "new"; // 静默失败
        console.log(frozenObj); // { prop: 42 }
        ```

    *   **相关方法**:
        *   `Object.seal(obj)`: 密封一个对象，阻止添加新属性并将所有现有属性标记为不可配置。但属性的值仍然可以修改。
        *   `Object.preventExtensions(obj)`: 阻止向对象添加新属性。

10. **`Object.is(value1, value2)`**
    *   **作用**：判断两个值是否为**同一个值**。它类似于 `===` 运算符，但有两个主要区别：
        *   `Object.is(NaN, NaN)` // `true` (而 `NaN === NaN` 为 `false`)
        *   `Object.is(+0, -0)` // `false` (而 `+0 === -0` 为 `true`)
    *   **示例**:

        ```javascript
        console.log(Object.is('foo', 'foo'));     // true
        console.log(Object.is(window, window));   // true
        console.log(Object.is(NaN, NaN));         // true
        console.log(Object.is(+0, -0));           // false
        ```

---

### 2. `Object.prototype` 的实例方法（`myObj.methodName()`）

这些方法存在于几乎所有对象的 `[[Prototype]]` 链上。

1.  **`hasOwnProperty(prop)`**
    *   **作用**：返回一个布尔值，指示对象**自身**属性中是否具有指定的属性（而不是从原型链上继承的）。这是检查对象自有属性最可靠的方法。
    *   **示例**:

        ```javascript
        const o = { a: 1 };
        o.hasOwnProperty('a'); // true
        o.hasOwnProperty('toString'); // false (toString 是从 Object.prototype 继承的)
        ```

2.  **`toString()`**
    *   **作用**：返回一个表示该对象的字符串。默认情况下，它返回 `"[object Type]"`，其中 `Type` 是对象的类型。许多内置对象（如 `Array`, `Date`）都**重写**了此方法，以提供更有意义的信息。
    *   **示例**:

        ```javascript
        const o = {};
        o.toString(); // "[object Object]"

        const arr = [1, 2, 3];
        arr.toString(); // "1,2,3"

        const date = new Date();
        date.toString(); // "Wed May 15 2024 10:30:00 GMT+0800 (中国标准时间)" (示例值)

        // 获取对象的准确类型
        Object.prototype.toString.call([]).slice(8, -1); // "Array"
        Object.prototype.toString.call(null).slice(8, -1); // "Null"
        ```

3.  **`valueOf()`**
    *   **作用**：返回指定对象的**原始值**。当 JavaScript 需要将一个对象转换为原始值时（例如，在数学运算中），会自动调用此方法。默认情况下，它返回对象本身。像 `Number`、`Date` 等对象也重写了此方法。
    *   **示例**:

        ```javascript
        const o = { a: 1 };
        o.valueOf(); // { a: 1 } (默认返回自身)

        const n = new Number(123);
        n.valueOf(); // 123

        const d = new Date();
        d.valueOf(); // 1715734200000 (时间戳)
        ```

4.  **`propertyIsEnumerable(prop)`**
    *   **作用**：返回一个布尔值，表明指定的属性名是否是该对象的**自有属性**并且是**可枚举的**。
    *   **示例**:

        ```javascript
        const obj = {};
        obj.a = 1;
        Object.defineProperty(obj, 'b', { value: 2, enumerable: false });

        obj.propertyIsEnumerable('a'); // true
        obj.propertyIsEnumerable('b'); // false
        ```

---

## 使用场景

### 问题一：如何安全地遍历一个对象的属性？

**新手写法 (有风险):**

```javascript
const user = { name: "Alice", age: 30 };

for (const key in user) {
  console.log(key, user[key]);
}
```

**潜在问题**：`for...in` 循环会遍历对象**及其原型链上所有可枚举的属性**。如果某个人（或某个库）给 `Object.prototype` 添加了方法，你的循环就会出问题。

```javascript
// 某个不规范的库修改了原型
Object.prototype.getGreeting = function() { return "Hello"; };

const user = { name: "Alice", age: 30 };

for (const key in user) {
  console.log(key); // 会输出 name, age, 以及 getGreeting！
}
```

**专业写法 (健壮且高效):**

```javascript
const user = { name: "Alice", age: 30 };

// 方式一：使用 Object.keys()，只遍历自有可枚举属性
Object.keys(user).forEach(key => {
  console.log(key, user[key]); // 只会输出 name, age
});

// 方式二：如果必须用 for...in，请配合 hasOwnProperty()
for (const key in user) {
  if (user.hasOwnProperty(key)) { // 确保是自有属性
    console.log(key, user[key]); // 只会输出 name, age
  }
}
```

**重要性体现**：`Object.keys()` 和 `hasOwnProperty()` 是编写**可预测、无副作用**代码的保障。它们能帮你隔离出真正属于你自己的对象属性，避免外部污染。

---

### 问题二：如何高效地合并多个对象（例如，合并默认配置和用户配置）？

这是一个非常常见的需求，比如写一个函数，它有默认参数，也允许用户传入自定义参数来覆盖默认值。

**新手写法 (繁琐且容易出错):**

```javascript
function createButton(options) {
  const defaults = { color: 'blue', text: 'Click Me', size: 'medium' };

  const finalOptions = {};
  finalOptions.color = options.color || defaults.color;
  finalOptions.text = options.text || defaults.text;
  finalOptions.size = options.size || defaults.size;
  // ... 如果有很多属性，这里会非常冗长
  // 如果有嵌套对象，这种方式就完全失效了（浅拷贝问题）

  console.log(finalOptions);
}
```

**专业写法 (简洁且强大):**

```javascript
function createButton(options) {
  const defaults = { color: 'blue', text: 'Click Me', size: 'medium' };

  // 一行代码搞定合并，options 中的属性会覆盖 defaults
  const finalOptions = Object.assign({}, defaults, options); 

  console.log(finalOptions);
}

createButton({ color: 'red', text: 'Submit' });
// 输出: { color: 'red', text: 'Submit', size: 'medium' }
```

**重要性体现**：`Object.assign()` 是**代码复用和减少冗余**的利器。它让“合并”这个操作变得声明式、一目了然，极大地提升了开发效率和代码可读性。

---

### 问题三：如何精确地控制对象的行为？例如，创建一个只读的配置对象？

**新手写法 (无能为力):**

```javascript
const config = { apiKey: "abc-123", endpoint: "https://api.example.com" };

// 你只能口头约定：“这个 config 对象不要改啊！”
// 但其他人（甚至是未来的你）完全可以：
config.apiKey = "hacked!";
// 配置就被轻易修改了，这可能引发严重的安全问题或逻辑错误。
```

**专业写法 (强制约束):**

```javascript
const config = { apiKey: "abc-123", endpoint: "https://api.example.com" };

// 冻结对象，任何修改都会静默失败（严格模式下报错）
Object.freeze(config);

config.apiKey = "hacked!"; // 无效
config.newProp = "test"; // 无效

console.log(config.apiKey); // 依然是 "abc-123"
console.log(config); // 依然是 { apiKey: "abc-123", endpoint: "https://api.example.com" }
```


