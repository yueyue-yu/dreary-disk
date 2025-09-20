---
title: Object 方法速查
description: ""
publishDate:  2025-09-20
tags:
  - JavaScript
draft: false
---

---

## 一、先搞清两个概念

- 静态方法：定义在构造函数上，直接用 `Object.method()` 调用，常用于创建、检查与操作对象。
- 实例方法：定义在 `Object.prototype` 上，几乎所有对象都会继承，可用 `obj.method()` 调用。通过 `Object.create(null)` 创建的对象没有原型，不继承这些方法。

补充：属性描述符包含
- `value`, `writable`, `enumerable`, `configurable`
- `get`, `set`（访问器属性）
默认值提醒：用 `defineProperty` 创建属性时，`writable/enumerable/configurable` 默认为 `false`。

---

## 二、`Object` 的静态方法（Object.method）

### 1) `Object.create(proto, [propertiesObject])`
- 作用：基于 `proto` 作为原型创建对象；可同时用描述符定义属性。
- 示例：原型式继承与“纯字典”

```javascript
const person = { greet() { console.log(`Hi, I'm ${this.name}`); } };

const me = Object.create(person);
me.name = 'Alice';
me.greet(); // "Hi, I'm Alice"

// 纯字典：无原型，适合做安全键值表
const dict = Object.create(null);
dict['__proto__'] = 'ok'; // 不会污染原型
console.log(Object.getPrototypeOf(dict)); // null
```

- 常用场景：原型式继承；创建“无原型字典”避免原型污染。

---

### 2) `Object.assign(target, ...sources)`
- 作用：将源对象的“自有可枚举属性”（含 symbol）浅拷贝到 `target`。
- 示例：合并默认配置与用户配置

```javascript
const defaults = { color: 'blue', size: 'm', theme: { contrast: 'normal' } };
const user = { color: 'red', theme: { contrast: 'high' } };

const finalOptions = Object.assign({}, defaults, user);
console.log(finalOptions);
// { color: 'red', size: 'm', theme: { contrast: 'high' } }  (浅拷贝)

// 注意：嵌套对象是浅拷贝，引用会被共享
finalOptions.theme.contrast = 'low';
console.log(defaults.theme.contrast); // 'low'
```

- 小贴士：语法糖 `{ ...defaults, ...user }` 等价。若要深拷贝/深合并，需要递归或使用库。

---

### 3) `Object.defineProperty(obj, prop, descriptor)`
- 作用：用描述符精细控制属性（只读、隐藏、getter/setter 等）。
- 示例：定义只读与计算属性

```javascript
const user = {};
Object.defineProperty(user, 'id', {
  value: 1001,
  writable: false,      // 只读
  enumerable: false,    // 不出现在枚举中
  configurable: false
});

let first = 'Alice', last = 'Wang';
Object.defineProperty(user, 'fullName', {
  get() { return `${first} ${last}`; },
  set(v) { [first, last] = v.split(' '); },
  enumerable: true
});

console.log(user.fullName); // "Alice Wang"
user.fullName = 'Bob Lee';
console.log(user.fullName); // "Bob Lee"
```

- 常见错误：同一属性不能同时设置 `value/writable` 与 `get/set`。

---

### 4) `Object.defineProperties(obj, descriptors)`
- 作用：一次性定义多个属性。
- 示例：

```javascript
const product = {};
Object.defineProperties(product, {
  id: { value: 1, enumerable: true },
  name: { value: 'Book', enumerable: true },
  priceWithTax: {
    get() { return 12.5 * 1.1; }, enumerable: true
  }
});
```

---

### 5) `Object.getOwnPropertyDescriptor(obj, prop)`
- 作用：获取某个“自有属性”的描述符。

```javascript
const o = {};
Object.defineProperty(o, 'hidden', { value: 1, enumerable: false });
console.log(Object.getOwnPropertyDescriptor(o, 'hidden'));
// { value: 1, writable: false, enumerable: false, configurable: false }
```

---

### 6) `Object.getOwnPropertyDescriptors(obj)`
- 作用：获取所有自有属性的描述符映射。
- 用法：保留 getter/setter/可枚举性的“完整克隆”

```javascript
function cloneWithDescriptors(src) {
  const clone = Object.create(Object.getPrototypeOf(src));
  return Object.defineProperties(clone, Object.getOwnPropertyDescriptors(src));
}
```

---

### 7) `Object.keys(obj)`
- 作用：返回自有“可枚举”的字符串键数组（不包含 symbol）。

```javascript
const user = { id: 1, name: 'Bob' };
console.log(Object.keys(user)); // ['id', 'name']
```

### 8) `Object.values(obj)`
- 作用：返回自有可枚举属性值数组。

```javascript
console.log(Object.values({ a: 1, b: 2 })); // [1, 2]
```

### 9) `Object.entries(obj)`
- 作用：返回自有可枚举的 `[key, value]` 数组。
- 示例：对象映射/过滤

```javascript
const user = { id: 1, name: 'Bob', password: '***' };
const safe = Object.fromEntries(Object.entries(user).filter(([k]) => k !== 'password'));
console.log(safe); // { id: 1, name: 'Bob' }
```

### 10) `Object.fromEntries(iterable)`
- 作用：将键值对（如 `Map` 或 `entries`）转为对象。

```javascript
const map = new Map([['a', 1], ['b', 2]]);
console.log(Object.fromEntries(map)); // { a: 1, b: 2 }
```

---

### 11) `Object.getOwnPropertyNames(obj)`
- 作用：获取自有字符串键（包含不可枚举，不包含 symbol）。

```javascript
const o = Object.create(null, { a: { value: 1, enumerable: false } });
console.log(Object.getOwnPropertyNames(o)); // ['a']
```

### 12) `Object.getOwnPropertySymbols(obj)`
- 作用：获取自有 symbol 键。

```javascript
const s = Symbol('x');
const o = { [s]: 123 };
console.log(Object.getOwnPropertySymbols(o)); // [ Symbol(x) ]
```

- 相关：想一次拿到“字符串键 + symbol 键”，用 `Reflect.ownKeys(obj)`（不是 Object 方法）。

---

### 13) `Object.getPrototypeOf(obj)`
- 作用：获取对象原型。

```javascript
const arr = [];
console.log(Object.getPrototypeOf(arr) === Array.prototype); // true
```

### 14) `Object.setPrototypeOf(obj, proto)`
- 作用：设置对象原型（性能较差，创建时用 `Object.create` 更好）。

```javascript
const a = {};
const proto = { x: 1 };
Object.setPrototypeOf(a, proto);
console.log(a.x); // 1
```

---

### 15) `Object.freeze(obj)`
- 作用：冻结对象（浅冻结）：不能新增/删除/改值/改描述符。

```javascript
const conf = Object.freeze({ api: 'v1', nested: { a: 1 } });
conf.api = 'v2'; // 无效（严格模式下报错）
conf.nested.a = 2; // 有效（浅冻结）
```

### 16) `Object.seal(obj)`
- 作用：密封对象：不可新增/删除属性，但可改值。

```javascript
const o = Object.seal({ a: 1 });
o.a = 2;    // 可
delete o.a; // 不可
```

### 17) `Object.preventExtensions(obj)`
- 作用：阻止新增属性（已有属性能否删/改由各自描述符决定）。

```javascript
const o = Object.preventExtensions({ a: 1 });
o.b = 2; // 无效
```

### 18) `Object.is(value1, value2)`
- 作用：同值相等判断（区别 `===`）

```javascript
console.log(Object.is(NaN, NaN)); // true
console.log(Object.is(+0, -0));   // false
console.log(Object.is(1, 1));     // true
```

### 19) `Object.isExtensible(obj)` / `Object.isFrozen(obj)` / `Object.isSealed(obj)`
- 作用：分别判断对象是否可扩展/已冻结/已密封。

```javascript
const o = {};
console.log(Object.isExtensible(o)); // true
Object.preventExtensions(o);
console.log(Object.isExtensible(o)); // false
```

### 20) `Object.hasOwn(obj, prop)`（推荐）
- 作用：安全判断“自有属性”，不受对象上同名字段影响（ES2022+）。

```javascript
const o = Object.create({ inherited: 1 });
o.own = 2;
console.log(Object.hasOwn(o, 'own'));       // true
console.log(Object.hasOwn(o, 'inherited')); // false
```

---

## 三、`Object.prototype` 的实例方法（obj.method）

### 1) `hasOwnProperty(prop)`
- 作用：判断是否为“自有属性”。
- 注意：对象可能定义同名字段覆盖该方法，使用更安全的 `Object.hasOwn(obj, prop)`。

```javascript
const o = { a: 1 };
console.log(o.hasOwnProperty('a')); // true
```

### 2) `propertyIsEnumerable(prop)`
- 作用：判断“自有属性”是否可枚举。

```javascript
const o = {};
Object.defineProperty(o, 'x', { value: 1, enumerable: false });
console.log(o.propertyIsEnumerable('x')); // false
```

### 3) `isPrototypeOf(object)`
- 作用：判断某对象是否在另一个对象的原型链上。

```javascript
const proto = { p: 1 };
const obj = Object.create(proto);
console.log(proto.isPrototypeOf(obj)); // true
```

### 4) `toString()`
- 作用：返回字符串表示；配合 `call` 做类型判断。

```javascript
console.log({}.toString()); // "[object Object]"
console.log(Object.prototype.toString.call([]));   // "[object Array]"
console.log(Object.prototype.toString.call(null)); // "[object Null]"
```

- 提示：可被 `Symbol.toStringTag` 影响。

### 5) `toLocaleString()`
- 作用：本地化字符串表示；如 `Date`、`Number` 已重写。

```javascript
console.log((1234567.89).toLocaleString('de-DE')); // "1.234.567,89"
```

### 6) `valueOf()`
- 作用：返回对象的“原始值”。多数内建类型已重写，一般很少自定义。

```javascript
console.log(new Number(123).valueOf()); // 123
```

- 进阶：如需自定义对象到原始值的转换，优先使用 `Symbol.toPrimitive`。

---

## 四、常见实战场景（含示例）

### 场景 1：安全遍历对象属性
- 只遍历自有可枚举属性

```javascript
const user = { name: 'Alice', age: 30 };
for (const [k, v] of Object.entries(user)) {
  console.log(k, v);
}
```

- 必须用 `for...in` 时，配合 `Object.hasOwn`

```javascript
for (const k in user) {
  if (Object.hasOwn(user, k)) {
    console.log(k, user[k]);
  }
}
```

- 包含 symbol 或不可枚举属性时

```javascript
for (const k of Reflect.ownKeys(user)) {
  const desc = Object.getOwnPropertyDescriptor(user, k);
  console.log(k, desc && desc.value);
}
```

### 场景 2：合并默认配置与用户配置

```javascript
const defaults = { color: 'blue', text: 'Click', style: { fontSize: 14 } };
const user = { color: 'red' };

const opts = { ...defaults, ...user }; // 或 Object.assign({}, defaults, user)
```

- 深合并提示

```javascript
function deepMerge(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = deepMerge(a[k] || {}, v);
    } else {
      out[k] = v;
    }
  }
  return out;
}
```

### 场景 3：创建只读配置 / 不可变对象

```javascript
const config = Object.freeze({ apiKey: 'abc-123', nested: { a: 1 } });
// 深冻结：对子对象递归
function deepFreeze(o) {
  Object.getOwnPropertyNames(o).forEach((k) => {
    const v = o[k];
    if (v && typeof v === 'object') deepFreeze(v);
  });
  return Object.freeze(o);
}
```

### 场景 4：克隆对象（保留原型、getter/setter、枚举性）

```javascript
function cloneWithDescriptors(src) {
  const clone = Object.create(Object.getPrototypeOf(src));
  return Object.defineProperties(clone, Object.getOwnPropertyDescriptors(src));
}
```

### 场景 5：过滤/重命名对象字段

```javascript
const user = { id: 1, name: 'Bob', password: '***' };
const safe = Object.fromEntries(Object.entries(user).filter(([k]) => k !== 'password'));
const renamed = Object.fromEntries(Object.entries(user).map(([k, v]) => [k === 'id' ? 'userId' : k, v]));
```

### 场景 6：构建“纯字典”避免原型污染

```javascript
const dict = Object.create(null);
dict['toString'] = 'ok';   // 只是普通键，不会覆盖方法
dict['__proto__'] = 'ok';  // 不会影响原型
```

### 场景 7：精准类型判断与“普通对象”判定

```javascript
const type = Object.prototype.toString.call([]).slice(8, -1); // "Array"

function isPlainObject(x) {
  if (typeof x !== 'object' || x === null) return false;
  const p = Object.getPrototypeOf(x);
  return p === Object.prototype || p === null;
}
```

### 场景 8：锁定对象“形状”（防意外扩展）

```javascript
const opts = { a: 1 };
Object.seal(opts);                 // 禁止新增/删除键，但可改值
Object.preventExtensions(opts);    // 禁止新增键（删除/修改看描述符）
```

### 场景 9：对象与 Map 互转

```javascript
const obj = { a: 1, b: 2 };
const map = new Map(Object.entries(obj));
const back = Object.fromEntries(map);
```

---

## 五、常见坑与最佳实践

- 浅拷贝陷阱：`Object.assign` 与展开语法都是浅拷贝；嵌套对象会共享引用。
- Getter 会被触发：`Object.assign` 会读取源对象属性，可能触发 getter 和副作用。
- `defineProperty` 默认不可写/不可枚举/不可配置，记得显式设置。
- 遍历顺序：`Object.keys/values/entries` 不包含 symbol；整数索引键会排在字符串键前。
- `for...in` 会枚举原型链，需配合 `Object.hasOwn(obj, key)`。
- 性能提示：避免频繁使用 `Object.setPrototypeOf`；创建时用 `Object.create`。
- 冻结是浅的：`Object.freeze` 不会冻结子对象；有需要请写 `deepFreeze`。
- 更安全的“自有属性”判断：优先 `Object.hasOwn(obj, key)`，而不是 `obj.hasOwnProperty(key)`。

---

## 六、附录：小工具函数合集

```javascript
// 深冻结
function deepFreeze(o) {
  Object.getOwnPropertyNames(o).forEach((k) => {
    const v = o[k];
    if (v && typeof v === 'object') deepFreeze(v);
  });
  return Object.freeze(o);
}

// 完整克隆（保留原型与描述符）
function cloneWithDescriptors(src) {
  const clone = Object.create(Object.getPrototypeOf(src));
  return Object.defineProperties(clone, Object.getOwnPropertyDescriptors(src));
}

// 选择部分字段（pick）
function pick(obj, keys) {
  return Object.fromEntries(keys.filter(k => Object.hasOwn(obj, k)).map(k => [k, obj[k]]));
}

// 排除部分字段（omit）
function omit(obj, keys) {
  const ban = new Set(keys);
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !ban.has(k)));
}
```

---
