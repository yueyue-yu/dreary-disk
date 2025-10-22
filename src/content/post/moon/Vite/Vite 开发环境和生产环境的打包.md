---
title: Vite 开发环境和生产环境的打包
description: ""
publishDate:  2025-10-15
tags:
  - Vite
draft: false
---




## 开发环境 

在开发环境下，Vite 的工作方式是革命性的，它充分利用了现代浏览器原生支持 ES 模块（ESM）的特性。

### 1. 工作流程

1.  **启动 Dev Server**：当你运行 `vite` 命令时，它会启动一个本地开发服务器。
2.  **浏览器请求**：浏览器请求 `index.html` 文件。
3.  **原生 ESM 加载**：HTML 中会有一个类似 `<script type="module" src="/src/main.ts"></script>` 的入口。浏览器会原生解析它，并根据 `import` 语句去请求依赖的模块，例如 `import App from './App.vue'`。
4.  **Vite 按需拦截和转换**：Vite Dev Server 会拦截这些模块请求。
    * 如果是 `.js` / `.ts` 文件，Vite 会直接返回。
    * 如果是 `.vue`、`.jsx`、`.scss` 等需要编译的文件，Vite 会 **即时（On-demand）** 将它们编译成浏览器可执行的 JavaScript 和 CSS，然后返回给浏览器。
5.  **不打包源码**：你的业务代码（`src` 目录下的文件）**不会被打包**。你修改一个文件，Vite 只需重新编译这一个文件，浏览器也只需重新请求这一个模块，实现了极快的 **热模块替换 (HMR)**。

### 2. 特殊优化：依赖预构建 (Dependency Pre-bundling)

虽然源码不打包，但 Vite 对 `node_modules` 里的第三方依赖做了一个 **预构建** 的步骤。这是开发环境启动快的一个关键。

**为什么要做预构建？**

*   **格式兼容**：许多老的第三方库是 CJS 或 UMD 格式，浏览器原生 ESM 无法直接使用。Vite 使用 `esbuild` 将它们统一转换成 ESM 格式。
*   **性能优化**：一些大型库（如 `lodash-es`）可能由数百个小模块组成。如果让浏览器一个个去请求，会造成巨大的网络开销（HTTP 请求瀑布流）。预构建将它们打包成一个或少数几个大的 ESM 文件，大大减少了请求数量。

这个过程在你首次启动 `dev server` 或依赖更新后自动发生，结果会缓存在 `node_modules/.vite` 目录中，后续启动会非常快。

**开发环境小结：**

*   **核心**：利用原生 ESM，不打包业务代码。
*   **工具**：Vite Dev Server + `esbuild` (用于依赖预构建)。
*   **优点**：
    * 启动速度极快，秒级启动。
    * 热更新 (HMR) 速度极快，几乎是瞬时的。
    * 源码映射准确，调试方便。
*   **缺点**：因为是按需加载，首次打开页面或切换到未加载的路由时，浏览器会发起较多请求（但因为是本地开发，影响不大）。

---

## 生产环境 

在生产环境下，Vite 的目标就变了，不再是开发速度，而是最终产物的性能。这时，它会采用传统的打包方式，并进行深度优化。

### 1. 工作流程

当你运行 `vite build` 命令时，Vite 会调用 **Rollup** 作为其底层的打包工具，执行一套完整的构建流程。

### 2. 主要优化措施

1.  **打包 (Bundling)**：将你项目中所有的源码、依赖、CSS 等合并成少数几个静态文件（JS, CSS），减少线上环境的 HTTP 请求数。
2.  **Tree-shaking (摇树)**：Rollup 的强项。它会分析代码，自动移除所有未被引用的“死代码”（dead-code），有效减小包体积。
3.  **代码压缩 (Minification)**：
    *   **JS 压缩**：默认使用 `Terser`（可以配置为 `esbuild` 以获得更快的压缩速度，但压缩率稍低）来移除空格、注释，并缩短变量名。
    *   **CSS 压缩**：移除空格、注释，合并相同的样式规则。
4.  **代码分割 (Code Splitting)**：
    *   Vite 会自动将代码分割成多个块（chunks）。例如，基于动态导入 `import()`（如路由懒加载）创建异步加载的块。
    * 它还会将公共模块（多个页面都用到的代码）提取出来，作为公共块，最大限度地利用浏览器缓存。
5.  **资源哈希 (Asset Hashing)**：为生成的 JS、CSS、图片等静态资源文件名添加哈希值（如 `main.a1b2c3d4.js`）。这样可以将它们配置为永久缓存。当文件内容改变时，哈希值也会改变，浏览器就会自动请求新文件，完美解决了缓存更新问题。
6.  **CSS 处理**：将所有组件中的 CSS（如 Vue SFC 中的 `<style>` 块）提取出来，合并成一个或多个独立的 `.css` 文件，并通过 `<link>` 标签在 HTML 中引入。

**生产环境小结：**

*   **核心**：使用 Rollup 进行完整打包和优化。
*   **工具**：`Rollup` (默认) + `Terser` / `esbuild` (用于压缩)。
*   **优点**：
    * 加载性能高，文件体积小。
    *   HTTP 请求数量少。
    * 利用浏览器缓存机制。
*   **缺点**：构建时间相对开发环境会长很多，因为需要进行大量的编译、分析和优化工作。

---

## 总结对比表格

| 方面 (Aspect) | 开发环境 (`vite dev`) | 生产环境 (`vite build`) |
| :--- | :--- | :--- |
| **核心目标** | 极致的开发体验（速度） | 极致的用户体验（性能） |
| **打包策略** | **不打包**业务代码，仅**预构建**依赖 | **完整打包**所有代码和资源 |
| **底层工具** | Vite Dev Server + `esbuild` | `Rollup` (默认) |
| **服务启动** | 极快（秒级） | 无（生成静态文件） |
| **热更新 (HMR)** | 极快（基于原生 ESM，按需更新） | 不适用 |
| **HTTP 请求** | 较多，按需请求模块 | 很少，合并成几个文件 |
| **代码优化** | 无（为了保持可读性和调试） | 全面优化（Tree-shaking、压缩、代码分割） |
| **输出产物** | 无（内存中服务） | `dist` 目录下的高度优化的静态文件 |

通过这种“双模”策略，Vite 聪明地解决了传统打包工具（如 Webpack）在开发模式下启动和热更新缓慢的问题，同时又没有牺牲生产环境的最终性能，是其广受欢迎的核心原因。



## 原生ESM


### 一、什么是原生 ESM？

**原生 ESM (Native ES Modules)** 指的是 **浏览器本身原生支持的 ECMAScript 模块系统**。

简单来说，就是我们不再需要 Webpack、Rollup 等打包工具的“模拟”或“翻译”，就可以直接在浏览器的 `<script>` 标签中使用 `import` 和 `export` 关键字来组织和加载 JavaScript 代码。

这是 JavaScript 语言官方的、标准化的模块化方案。

### 二、回顾历史：没有模块化的痛苦

在 ESM 出现之前，JavaScript 代码的组织非常原始：

1.  **全局变量污染**：所有 JS 文件共享同一个全局作用域（`window`），很容易发生变量命名冲突。
2.  **依赖关系不明**：你必须在 HTML 中手动维护 `<script>` 标签的顺序，如果 `b.js` 依赖 `a.js`，那么 `a.js` 必须在 `b.js` 之前引入，大型项目中这简直是噩梦。

为了解决这些问题，社区发明了多种模块化方案，最著名的是：

*   **CommonJS (CJS)**：主要用于 Node.js 环境，使用 `require()` 同步加载模块，`module.exports` 导出模块。它不适合浏览器，因为同步加载会阻塞页面渲染。
*   **AMD (Asynchronous Module Definition)**：如 `RequireJS`，专为浏览器设计，使用 `define()` 定义模块，异步加载，但语法比较繁琐。

这些都是“社区方案”，不是语言的原生能力。因此，你需要打包工具（如 Webpack）将这些模块语法转换为浏览器能运行的单个文件。

## 原生 ESM 的工作方式

ESM 从语言层面解决了模块化问题。它的工作方式非常直观。

### 1. 声明一个模块脚本

你只需要在 `<script>` 标签上添加 `type="module"`，浏览器就会将其作为 ES 模块来处理。

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<body>
  <h1>Hello from Native ESM!</h1>
  <!-- 这是一个模块脚本，是整个依赖图的入口 -->
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

### 2. 使用 `export` 导出功能

在你的模块文件中，使用 `export` 关键字将变量、函数或类暴露给其他模块。

```javascript
// /src/math.js

// 命名导出 (Named Export)
export const PI = 3.14;

export function add(a, b) {
  return a + b;
}

// 默认导出 (Default Export)，每个文件只能有一个
const privateSecret = 'shhh';
export default function multiply(a, b) {
  return a * b;
}
```

### 3. 使用 `import` 导入功能

在另一个模块中，使用 `import` 关键字来引入其他模块提供的功能。

```javascript
// /src/main.js

// 导入命名导出的成员，名字必须匹配
import { PI, add } from './math.js';

// 导入默认导出的成员，可以自己取任意名字（这里叫'multiplyFunc'）
import multiplyFunc from './math.js';

console.log('PI is:', PI); // PI is: 3.14
console.log('2 + 3 =', add(2, 3)); // 2 + 3 = 5
console.log('2 * 3 =', multiplyFunc(2, 3)); // 2 * 3 = 6

// 不能在这里访问 math.js 中的 privateSecret
// console.log(privateSecret); // ReferenceError
```

### 4. 浏览器的加载过程

当浏览器遇到 `<script type="module">` 时：

1.  **解析根模块**：浏览器请求并解析 `main.js`。
2.  **发现依赖**：在解析过程中，它发现了 `import ... from './math.js'` 语句。
3.  **请求依赖模块**：浏览器会立刻发起一个新的 HTTP 请求去获取 `./math.js`。
4.  **递归解析**：如果 `math.js` 又依赖了其他模块，浏览器会继续这个过程，直到整个**依赖图 (Dependency Graph)** 中的所有模块都被获取和解析。
5.  **执行代码**：一旦所有模块都准备就绪，浏览器就会按照正确的顺序执行它们。


