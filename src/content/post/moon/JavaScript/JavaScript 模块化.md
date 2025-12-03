---
title: JavaScript 模块化
description: ""
publishDate:  2025-11-25
tags:
  - JavaScript
draft: false
---


## 第一部分：背景与起源（为什么我们需要模块？）

JavaScript 在 1995 年诞生时，只是为了在网页上做一些简单的特效（如表单验证）。当时根本没有想过它会用来构建今天这样的大型应用。因此，**早期的 JavaScript 根本没有“模块”的概念。**

### 1. 没有模块时的三大痛点
在没有模块化标准的年代，前端开发主要面临以下灾难：

1.  **全局变量污染 (Global Scope Pollution)：**
    所有代码都在一个“全局作用域”里。

    ```javascript
    // A.js (张三写的)
    var name = "Data";
    // B.js (李四写的)
    var name = "User"; // 完了！张三的变量被覆盖了，程序逻辑崩溃。
    ```

2.  **依赖管理地狱 (Dependency Hell)：**
    你需要手动管理 `<script>` 标签的顺序。如果 `main.js` 依赖 `jquery.js`，那么 jQuery 必须写在前面。当文件有几十个时，维护顺序简直是噩梦。
3.  **代码难以维护：**
    代码像一团乱麻，牵一发而动全身。

### 2. 模块化的演变史（战国时代）
为了解决上述问题，JS 社区经历了漫长的探索：

*   **阶段一：IIFE (立即执行函数)：** 利用闭包模拟“私有作用域”，这是模块化的雏形。
*   **阶段二：分道扬镳 (服务端 vs 浏览器)：**
    *   **Node.js (服务端)** 诞生，因为读取硬盘文件很快，采用了 **CommonJS (CJS)** 规范，特点是**同步加载**。
    *   **浏览器端** 因为受限于网速，不能同步卡死页面，诞生了 **AMD (RequireJS)** 和 **CMD (Sea.js)**，特点是**异步加载**。
*   **阶段三：大一统 (ES6 标准)：**
    2015 年，ECMAScript 官方推出了 **ESM (ES Modules)**，旨在统一浏览器和服务器的模块规范。

---

## 第二部分：CJS (CommonJS) vs ESM (ES Modules)

现在，战场上主要剩下了两家：**Node.js 的老祖宗 CJS** 和 **JS 官方标准 ESM**。

### 1. 核心区别速览表

| 特性 | CJS (CommonJS) | ESM (ECMAScript Modules) |
| :--- | :--- | :--- |
| **代表环境** | Node.js (传统服务端) | 浏览器 + 现代 Node.js |
| **加载方式** | **同步** (Synchronous) | **编译时静态分析** + 异步加载 |
| **核心语法** | `require` / `module.exports` | `import` / `export` |
| **加载时机** | **运行时** (代码跑到这行才加载) | **编译时** (运行前就知道依赖关系) |
| **输出机制** | 值的**拷贝** (Copy) | 值的**引用** (Live Binding) |
| **Tree-shaking** | 困难 (因为是动态的) | **原生支持** (容易去除无用代码) |

---

### 2. CommonJS (CJS) 详解
CJS 是 Node.js 默认的模块规范。

*   **同步执行：** 代码运行到 `require('./math')` 时，会暂停，去硬盘读取文件，加载完才继续。
*   **动态性：** 你可以在 `if` 语句里引用模块。

**语法示例：**

```javascript
// math.js
const add = (a, b) => a + b;
module.exports = { add }; // 导出对象

// app.js
const { add } = require('./math'); // 导入
// 动态导入
if (true) {
    const utils = require('./utils');
}
```

---

### 3. ES Modules (ESM) 详解
ESM 是未来的主流，前端工程（Vue/React/Vite）默认全都是 ESM。

*   **静态分析：** `import` 语句必须在文件最顶部（静态导入）。编译器在运行代码前，就构建好了依赖关系图。
*   **Tree-shaking (摇树优化)：** 因为是静态分析，打包工具（Webpack/Vite）可以轻易发现哪个函数没被使用，并在打包时删掉它，减小体积。

**语法示例：**

```javascript
// math.js
export const add = (a, b) => a + b; // 命名导出
export default function() { ... }   // 默认导出

// app.js
import { add } from './math.js';
```

---

### 4. 面试必问：值的拷贝 vs 值的引用

这是两者最本质的技术区别。

#### CJS：输出的是值的拷贝
模块内部的变化，**不会**影响已经导入的值。就像复印了一份文件，原件改了，复印件不会变。

```javascript
// counter.js (CJS)
let count = 1;
module.exports = {
    count,
    inc: () => count++
};

// main.js
const { count, inc } = require('./counter');
console.log(count); // 1
inc();
console.log(count); // 1 (仍然是1，因为这里只是当初拷贝过来的一个数字)
```

#### ESM：输出的是值的引用 (Live Binding)
模块导出的变量是**只读引用**。模块内部变了，外部导入的地方**会自动变**。就像是指针或者软链接。

```javascript
// counter.js (ESM)
export let count = 1;
export const inc = () => count++;

// main.js
import { count, inc } from './counter.js';
console.log(count); // 1
inc();
console.log(count); // 2 (变成2了！时刻保持同步)
```

---

## 第三部分：总结与最佳实践

1.  **现在的局面：**
    *   **浏览器/前端开发：** 100% 使用 **ESM** (`import/export`)。
    *   **Node.js 开发：** 处于过渡期。旧项目大量使用 CJS，但新项目和新库都在转向 ESM。

2.  **如何在 Node.js 中开启 ESM？**
    Node.js 默认把 `.js` 当作 CJS。想用 ESM，你有两种方法：
    * 把文件后缀改为 `.mjs`。
    * 在 `package.json` 里加上 `"type": "module"`。

3.  **结论：**
    *   **CJS** 是为了解决服务端没有模块的历史产物，虽然现在依然广泛存在，但在逐渐成为“遗留标准”。
    *   **ESM** 是 JavaScript 语言层面的终极标准，支持静态分析、Tree-shaking 和浏览器原生加载，是**绝对的未来**。