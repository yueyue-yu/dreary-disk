---
title: JavaScript Object
description: ""
publishDate: 2025-09-15
tags:
  - JavaScript
draft: false
---



## Object → Primitive


### 转换简表

|**上下文**|**hint**|**调用顺序**|**说明**|
|---|---|---|---|
|**转字符串**|"string"|toString() → valueOf()|常见于 String(obj)、模板字符串 `${obj}`|
|**转数字**|"number"|valueOf() → toString()|常见于 Number(obj)、+obj、数学运算|
|**默认情况**|"default"|通常按 "number" 规则；**Date 特例** 按 "string" 规则|常见于 obj == "foo"、obj + "bar"|

---

### **调用机制细节**

1. **valueOf()**
    
    - 设计目标：返回对象的**数值表示**。
        
    - 如果返回原始值（number、string、boolean、symbol、bigint、null、undefined），则直接使用。
        
    - 否则忽略结果继续。
        
    
2. **toString()**
    
    - 设计目标：返回对象的**字符串表示**。
        
    - 如果返回原始值，则直接使用。
        
    - 否则继续。
        
    
3. **自定义 Symbol.toPrimitive(hint)**
    
    - 优先级最高。
        
    - 如果对象定义了 obj[Symbol.toPrimitive]，那么不管 hint 是 "string" / "number" / "default"，都会直接调用这个方法。
        
    - 返回必须是原始值，否则抛 TypeError。

``` JavaScript
let obj = {
  [Symbol.toPrimitive](hint) {
    if (hint === "string") return "str";
    if (hint === "number") return 123;
    return "default";
  }
};
console.log(String(obj)); // "str"
console.log(+obj);        // 123
console.log(obj + "");    // "default"
```

---

### 优先级

1. 如果对象定义了 Symbol.toPrimitive (hint) ，这个方法优先。
    
2. 否则走上面表格里的顺序。
    
3. 如果都不能返回原始值 → 抛 TypeError。

---

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
