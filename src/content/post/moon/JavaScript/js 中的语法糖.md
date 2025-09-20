---
title: js 中的语法糖
description: ""
publishDate:  2025-09-20
tags:
  - JavaScript
draft: false
---





## ...的使用

### 1. Rest Parameters (剩余参数) - 聚集

当 `...` 出现在**函数的参数列表**中时，它就是“剩余参数”。它的作用是捕获函数调用时传入的**所有剩余的、未被命名的参数**，并将它们放入一个**真正的数组**中。

**核心规则:**
* 必须是函数的**最后一个参数**。
* 一个函数定义中只能有一个剩余参数。


**在没有 Rest Parameters 的“远古时代”（ES5）**

以前，我们需要使用 `arguments` 对象来获取所有参数。但 `arguments` 是一个“类数组对象”，而不是真正的数组，使用起来很麻烦（没有 `forEach`, `map` 等方法）。

```javascript
function sumOld() {
  // arguments is not a real array, so we have to convert it first
  const args = Array.prototype.slice.call(arguments); 

  let total = 0;
  for (let i = 0; i < args.length; i++) {
    total += args[i];
  }
  return total;
}

console.log(sumOld(1, 2, 3)); // 6
```

**使用 Rest Parameters (现代 JS)**

代码变得极其简洁和直观。

```javascript
// ...numbers 会将所有传入的参数聚集到一个名为 `numbers` 的数组中
function sum(...numbers) {
  // `numbers` 是一个真正的数组，可以直接使用数组方法
  return numbers.reduce((total, current) => total + current, 0);
}

console.log(sum(1, 2, 3));       // 6
console.log(sum(10, 20, 30, 40)); // 100
console.log(sum());              // 0
```

**结合普通参数使用：**

```javascript
function logTeam(captain, coach, ...players) {
  console.log(`Captain: ${captain}`);
  console.log(`Coach: ${coach}`);
  console.log(`Players: ${players.join(', ')}`);
}

logTeam("Alice", "Bob", "Charlie", "David", "Eve");
// 输出:
// Captain: Alice
// Coach: Bob
// Players: Charlie, David, Eve 
```

在这里，`players` 捕获了除了前两个以外的所有剩余参数。

---

### 2. Spread Syntax (展开语法) - 展开

当 `...` 出现在函数调用、数组字面量或对象字面量中时，它就是“展开语法”。它的作用是将一个可迭代对象（如数组、字符串）或对象“展开”成其独立的组成部分。

#### 用途一：在函数调用中展开数组

这是 Rest Parameters 的反向操作。

```javascript
const numbers = [10, 5, 25, 15];

// 以前需要使用 .apply()
const max_old = Math.max.apply(null, numbers);

// 现在使用展开语法，非常直观
const max = Math.max(...numbers); // 等价于 Math.max(10, 5, 25, 15)

console.log(max); // 25
```

#### 用途二：在数组字面量 `[]` 中展开

这在处理数组时非常有用，尤其是在**不改变原数组（Immutability）**的情况下。

**a) 复制数组（浅拷贝）**

```javascript
const original = ['a', 'b', 'c'];
const copy = [...original];

copy.push('d');
console.log(original); // ['a', 'b', 'c'] (原数组未受影响)
console.log(copy);     // ['a', 'b', 'c', 'd']
```

**b) 合并数组**

```javascript
const arr1 = [1, 2];
const arr2 = [3, 4];
const combined = [...arr1, 'middle', ...arr2];

console.log(combined); // [1, 2, 'middle', 3, 4]
```

**c) 将字符串转换为字符数组**

```javascript
const str = "hello";
const chars = [...str];

console.log(chars); // ['h', 'e', 'l', 'l', 'o']
```

#### 用途三：在对象字面量 `{}` 中展开 (ES2018)

这对于处理对象同样非常强大，是 React 和其他现代框架中状态管理的核心。

**a) 复制对象（浅拷贝）**

```javascript
const originalObj = { name: "Alice", age: 30 };
const copyObj = { ...originalObj };

console.log(copyObj); // { name: "Alice", age: 30 }
```

**b) 合并对象**

```javascript
const obj1 = { a: 1, b: 2 };
const obj2 = { b: 3, c: 4 }; // 注意，obj2 也有属性 'b'
const mergedObj = { ...obj1, ...obj2 };

console.log(mergedObj); // { a: 1, b: 3, c: 4 }
// 规则：后面的同名属性会覆盖前面的。
```

**c) 以不可变的方式更新对象属性**

这是它最常见的用途！在不直接修改原对象的情况下，创建一个包含更新值的新对象。

```javascript
const user = {
  id: 101,
  name: "Bob",
  profile: {
    theme: "dark",
    notifications: true
  }
};

// 更新用户的 name
const updatedUser = { ...user, name: "Charlie" };
console.log(updatedUser); // { id: 101, name: "Charlie", profile: {...} }
console.log(user);        // { id: 101, name: "Bob", profile: {...} } (原对象未变)

// 更新嵌套对象的属性
const userWithNewTheme = {
  ...user,
  profile: {
    ...user.profile, // 先展开老的 profile
    theme: "light"   // 然后用新值覆盖 theme
  }
};
console.log(userWithNewTheme.profile.theme); // "light"
```

* 注意：* 无论是数组还是对象，展开语法执行的都是**浅拷贝 (Shallow Copy)**。这意味着如果对象或数组中包含其他对象（如上面的 `profile`），那么只复制了对那个嵌套对象的引用，而不是复制嵌套对象本身。

### 总结

| | Rest Parameters (剩余参数) | Spread Syntax (展开语法) |
| :--- | :--- | :--- |
| **作用** | **聚集** (Gather) | **展开** (Spread) |
| **做什么** | 将多个独立的元素**收集成一个数组**。 | 将一个数组/对象**展开成独立的元素**。 |
| **用在何处**| 函数的**参数定义**中，且必须是最后一个。 | 函数**调用**时、**数组字面量**`[]` 中、**对象字面量**`{}` 中。 |
| **示例** | `function fn(a, ...rest) {}` | `const arr = [...oldArr];`<br>`fn(...args);`<br>`const obj = {...oldObj};` |

## **Optional chaining ?.**

|**语法**|**作用**|**示例**|**使用场景**|
|---|---|---|---|
|obj?.prop|安全访问属性|user?.name|后端返回数据 user 可能是 null / undefined|
|obj?.[expr]|用变量/表达式安全取属性|user?.[key]|动态属性名，例如配置表、字典数据|
|obj?.method?.()|安全调用方法|user?.getName?.()|可选回调函数、可能未定义的方法|

---

- 避免 Cannot read property ... of undefined/null 报错。
    
- 遇到 null 或 undefined 会 **短路**，直接返回 undefined。
    
- 只能用于 **读取/调用**，不能作为赋值目标。

---
