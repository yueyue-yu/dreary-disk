---
title: DOM 类型继承链
description: 可视化梳理 DOM 的继承结构：从 EventTarget 到 Node、Element、HTMLElement 及具体元素，并补充 Text/Comment/Document 分支与 instanceof 验证方法。
publishDate: 2025-07-29
tags:
  - DOM
  - JavaScript
draft: false
---
  
### DOM 类型继承链（可视化）

```Plain
                   ┌───────────┐
                   │ EventTarget │ (能够处理事件)
                   └───────────┘
                         ▲
                         │ (继承自)
                   ┌───────────┐
                   │   Node    │ (是树中的一个节点)
                   └───────────┘
           ┌─────────────┴─────────────┐
           │                           │
     ┌───────────┐               ┌───────────┐
     │  Element  │(是HTML/XML标签) │   Text    │(是文本)
     └───────────┘               └───────────┘
           ▲                           ▲
           │                           │
     ┌───────────┐               ┌───────────┐
     │ HTMLElement │(是HTML标签)      │  Comment  │(是注释)
     └───────────┘               └───────────┘
           ▲
           │
  ┌────────┴─────────────────────────────────┐
  │                │                         │
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│HTMLDivElement  │ │HTMLImageElement│ │HTMLAnchorElement│ ...等等
└────────────────┘ └────────────────┘ └────────────────┘
```
- **注意**：`Document` 也是一个 `Node`，但它不继承自 `Element`，它是一个特殊的、位于顶层的分支。
---
### 各层级详解
### 1. `EventTarget` (事件目标)
- **角色**：继承链的**最顶层祖先**。它不是一个可见的节点，而是一个抽象的接口。
- **提供的核心能力**：赋予对象**处理事件**的能力。
    - `addEventListener()`: 添加事件监听器。
    - `removeEventListener()`: 移除事件监听器。
    - `dispatchEvent()`: 派发一个事件。
- **谁继承了它？** 几乎所有 DOM 节点类型最终都继承自 `EventTarget`，所以它们都能监听和响应事件。
---
### 2. `Node` (节点)
- **角色**：代表 DOM 树中的一个**基础节点**。这是 `EventTarget` 的第一个具体后代。
- **继承自**：`EventTarget`。
- **提供的核心能力**：定义了节点在**树状结构中的关系和基本内容**。
    - `nodeType`: 节点的类型（数字，如 1 代表元素，3 代表文本）。
    - `nodeName`: 节点的名称（如 'DIV', '\#text'）。
    - `textContent`: 节点及其所有后代的文本内容。
    - `parentNode`: 父节点。
    - `childNodes`: 所有子节点的集合（NodeList）。
    - `firstChild`, `lastChild`: 第一个和最后一个子节点。
    - `appendChild()`, `removeChild()`, `insertBefore()`: 操作子节点。
---
### 3. `Element` (元素)
- **角色**：代表文档中的一个**元素标签**（如 HTML, XML, SVG 中的标签）。这是最常用的节点类型之一。
- **继承自**：`Node`。
- **提供的核心能力**：在 `Node` 的基础上，增加了**处理元素属性和进行精确查找**的能力。
    - `id`, `className`: 读写 `id` 和 `class` 属性。
    - `innerHTML`, `outerHTML`: 读写元素内部或自身的 HTML。
    - `children`: **只包含元素子节点**的集合（HTMLCollection）。
    - `getAttribute()`, `setAttribute()`: 通用的属性读写方法。
    - `querySelector()`, `querySelectorAll()`: 使用 CSS 选择器查找后代元素。
    - `closest()`: 向上查找匹配的父元素。
---
### 4. `HTMLElement` (HTML 元素)
- **角色**：**专门为 HTML 文档设计的元素类型**。这是所有 HTML 元素的通用父类。
- **继承自**：`Element`。
- **提供的核心能力**：在 `Element` 的基础上，增加了大量与**浏览器显示和交互相关的特有属性**。
    - `style`: 直接访问和修改元素的内联 CSS 样式。
    - `title`: 鼠标悬停提示文本。
    - `lang`, `dir`: 语言和文字方向。
    - `hidden`: 控制元素可见性。
    - `onclick`, `onmouseover` 等：事件处理属性。
    - `focus()`, `blur()`: 焦点管理。
    - `innerText`: 元素内可见的文本。
---
### 5. 具体的 HTML 元素（如 `HTMLImageElement`）
- **角色**：最具体的元素类型，代表特定的 HTML 标签。
- **继承自**：`HTMLElement`。
- **提供的核心能力**：在 `HTMLElement` 的基础上，增加了**该标签独有的属性和方法**。
    - `**HTMLImageElement**` **(**`**<img>**`**)**：增加了 `src`, `alt`, `width`, `height` 等属性。
    - `**HTMLAnchorElement**` **(**`**<a>**`**)**：增加了 `href`, `target`, `download` 等属性。
    - `**HTMLInputElement**` **(**`**<input>**`**)**：增加了 `value`, `type`, `checked`, `disabled` 等属性。
    - `**HTMLFormElement**` **(**`**<form>**`**)**：增加了 `submit()`, `reset()` 等方法和 `elements` 集合。
---
### 其他重要的 Node 分支
这些类型直接继承自 `Node`，但**不是** `Element`。
### `Text` (文本节点)
- **继承自**：`CharacterData` → `Node`
- **角色**：代表元素标签内部的文本内容。
- **核心能力**：`nodeValue` 或 `data` 属性可以获取或设置文本内容。
### `Comment` (注释节点)
- **继承自**：`CharacterData` → `Node`
- **角色**：代表 HTML 中的注释 `<!-- ... -->`。
### `Document` (文档节点)
- **继承自**：`Node`
- **角色**：代表整个文档，是 DOM 树的根。`document` 对象就是这个类型的实例。
- **核心能力**：提供了对整个文档的全局操作方法，如 `getElementById()`, `createElement()`。
### 总结与验证
- **继承意味着能力叠加**：一个 `HTMLImageElement` 对象，既有 `addEventListener` (来自 `EventTarget`)，也有 `parentNode` (来自 `Node`)，还有 `id` (来自 `Element`)，有 `style` (来自 `HTMLElement`)，最后还有自己专属的 `src`。
- **验证方法**：在浏览器控制台，你可以使用 `instanceof` 来验证这种关系。
    
    ```JavaScript
    const img = document.createElement('img');
    
    console.log(img instanceof HTMLImageElement); // true
    console.log(img instanceof HTMLElement);   // true
    console.log(img instanceof Element);       // true
    console.log(img instanceof Node);          // true
    console.log(img instanceof EventTarget);   // true
    ```
    

