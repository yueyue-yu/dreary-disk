---
title: CSS记忆知识点
description: 速记 CSS 的关键知识：选择器优先级、继承规律、常见简写属性的陷阱与规则，以及块/行内/行内块的盒模型默认行为。
publishDate:  2025-09-11
tags:
  - CSS
draft: false
---


## CSS 优先级 (Specificity)

| 优先级层级 | 选择器类型 | 权重值 | 核心规则 |
| :--- | :--- | :--- | :--- |
| **最高** | `!important` | ∞ | 覆盖所有其他规则，应避免滥用。 |
| **第一级** | 行内样式 (`style="..."`) | 1000 | 直接写在 HTML 元素上的样式。 |
| **第二级** | ID 选择器 (`#id`) | 100 | 唯一的标识符，权重高。 |
| **第三级** | 类 (`.class`), 属性 (`[type]`), 伪类 (`:hover`) | 10 | 最常用的选择器类型。 |
| **第四级** | 元素 (`div`), 伪元素 (`::before`) | 1 | 基础的标签选择器。 |
| **最低** | 通配符 (`*`), 继承的样式 | 0 | 权重最低，容易被覆盖。 |
| **同级比较** | 源码顺序 | - | 当权重完全相同时，后定义的规则生效。 |

---

## CSS 继承 (Inheritance)

| 继承类型      | 核心规则                             | 常见属性示例                                                                                              |
| :-------- | :------------------------------- | :-------------------------------------------------------------------------------------------------- |
| **默认继承**  | 文本相关的属性会自动从父元素继承。                | `color`, `font-family`, `font-size`, `font-weight`, `line-height`, `text-align`, `visibility`       |
| **默认不继承** | 盒模型、布局、背景等属性默认不会继承。              | `margin`, `padding`, `border`, `width`, `height`, `background`, `display`, `position`, `box-shadow` |
| **强制继承**  | 使用 `inherit` 关键字可以强制任何属性继承父元素的值。 | `border: inherit;` `background-color: inherit;`                                                     |

---

## CSS 简写属性 (Shorthand Properties)

| 简写属性 | 包含的子属性 | 核心规则与常见陷阱 | 推荐示例 |
| :--- | :--- | :--- | :--- |
| `margin` / `padding` | `*-top`, `*-right`, `*-bottom`, `*-left` | **规则**: 按顺时针方向（上、右、下、左）赋值。<br>**省略规则**: 1 个值=所有方向; 2 个值=上下/左右; 3 个值=上/左右/下。 | `margin: 10px 20px;` |
| `border` | `border-width`, `border-style`, `border-color` | **规则**: 顺序不强制，但推荐 `width style color`。<br>**陷阱**: 任何未指定的值都会被重置为**初始值**。例如 `border: 1px solid;` 会将 `border-color` 重置为 `currentColor` (通常是黑色)。 | `border: 1px solid #ccc;` |
| `background` | `color`, `image`, `repeat`, `position`, `size`, `attachment`, `origin`, `clip` | **规则**: `background-size` 必须在 `background-position` 之后并用 `/` 分隔。<br>**陷阱**: 这是最常见的覆盖陷阱。`background: red;` 会将 `background-image` 重置为 `none`，导致背景图消失。 | `background: #f0f0f0 url(...) no-repeat center / cover;` |
| `font` | `style`, `variant`, `weight`, `stretch`, `size`, `line-height`, `family` | **规则**: `font-size` 和 `font-family` **必须提供**，且 `font-family` 必须在最后。`line-height` 必须紧跟在 `font-size` 之后并用 `/` 分隔。<br>**陷阱**: 会重置所有未声明的字体属性，如 `font-weight` 会变回 `normal`。 | `font: italic 700 16px/1.5 "Helvetica Neue", sans-serif;` |
| `flex` | `flex-grow`, `flex-shrink`, `flex-basis` | **规则**: 这是一个非常强大的简写，值的解析很特殊。<br>**陷阱**: `flex: 1;` 会被解析为 `1 1 0%`，而不是 `1 1 auto`。`flex: auto;` 解析为 `1 1 auto`。`flex: none;` 解析为 `0 0 auto`。 | `flex: 1 1 0;` (用于等分空间) |
| `transition` | `property`, `duration`, `timing-function`, `delay` | **规则**: 浏览器可以根据值的单位自动识别（如 `s` 或 `ms` 代表时间）。<br>**陷阱**: 如果省略 `transition-property`，默认为 `all`，这可能导致不必要的性能开销。最好明确指定要过渡的属性。 | `transition: background-color 0.3s ease-in-out;` |
| `list-style` | `list-style-type`, `list-style-position`, `list-style-image` | **规则**: 顺序不强制。<br>**陷阱**: 使用 `list-style: none;` 是重置列表样式的最快方法，它会同时移除项目符号和图像。 | `list-style: square inside;` |

## 盒模型的默认宽度

| 特性                          | **块级 (`block`)**                                                             | **行内 (`inline`)**                                                         | **行内块 (`inline-block`)**                                               |
| :-------------------------- | :--------------------------------------------------------------------------- | :------------------------------------------------------------------------ | :--------------------------------------------------------------------- |
| **布局行为**                    | **独占一行**，从上到下排列。                                                             | **与其他行内元素在同一行**显示，从左到右排列，直到行满换行。                                          | **与其他行内元素在同一行**显示，从左到右排列，直到行满换行。                                       |
| **尺寸 (`width` / `height`)** | **可以**手动设置。 <br> • **默认宽度**：**填充父元素的可用宽度**（100%）。 <br> • **默认高度**：**由内容撑开**。 | **不可以**手动设置（设置无效）。 <br> • **默认宽度/高度**：**完全由内容决定**。高度通常受 `line-height` 影响。 | **可以**手动设置。 <br> • **默认宽度/高度**：**由内容决定**。                              |
| **外边距 (`margin`)**          | **上下左右均有效**。会推开其他元素。                                                         | **水平方向有效**，会推开其他元素。 <br> **垂直方向无效**（不影响布局），但背景色会延伸。                       | **上下左右均有效**。会推开其他元素。                                                   |
| **内边距 (`padding`)**         | **上下左右均有效**。会增加元素尺寸，推开其他元素。                                                  | **上下左右均有效**。背景色会延伸，但**垂直方向的 `padding` 不会推开其他行内元素或影响行高**。                  | **上下左右均有效**。会增加元素尺寸，推开其他元素。                                            |
| **垂直对齐 (`vertical-align`)** | ❌ **无效**。不适用于块级元素。                                                           | ✅ **有效**。可控制与同行元素（如文字）的基线、顶部、底部等对齐方式。                                     | ✅ **有效**。可控制与同行元素（如文字）的基线、顶部、底部等对齐方式。                                  |
| **能否嵌套在文本中**                | ❌ **否**。若插入文本流中，会破坏文本结构，导致前后文本换行。                                            | ✅ **是**。专门设计用于包裹文本或作为文本的一部分。                                              | ✅ **是**。非常适合在文本流中放置，如图标 + 文字的按钮。                                       |
| **典型元素举例**                  | `<div>`, `<p>`, `<h1>-<h6>`, `<ul>`, `<li>`, `<section>`, `<form>`           | `<span>`, `<a>`, `<strong>`, `<em>`, `<img>`, `<br>`, `<input>`           | `<img>`, `<button>`, `<input>`, `<select>`, `<textarea>`，以及许多自定义 UI 组件 |
| **常见用途**                    | 页面的整体结构布局、容器、段落、文章等大块内容。                                                     | 文本的局部样式强调、链接、或为小块内容提供样式钩子。                                                | 导航栏、按钮、标签、图文混排的卡片组件等需要既能设置尺寸又能在一行内排列的场景。                               |

inline-block 的出现是为了解决一个 web 开发中极其痛点的场景，那就是：

“我想让几个东西并排坐，但还要能控制它们的大小。”

block (砖墙)： 只能垂直堆叠，最稳固，最基础。

inline (水流)： 只能水平流动，没骨架，随波逐流。

inline-block (铺地砖)： 既有硬骨架，又能水平铺设。它是为了解决“水平布局 + 尺寸控制”而生的。

## **字体相对单位 (Font-relative Units)**

|**单位**|**参照物**|**特点与用途**|
|---|---|---|
|em|**双重参照**：① font-size → 父元素的 font-size；② 其他属性（如 width, padding）→ 元素自身的 font-size。|⚠️ 缺点：嵌套时会产生**复合效应**，计算复杂，不易维护。|
|rem|**根元素 (<html>) 的 font-size**|✅ 优点：基准唯一，无复合效应。常用于整站布局和字体系统。|
|ex|当前字体的 **x-height**（小写 x 的高度）|用于需要与小写字母高度对齐的场景，随字体变化。|
|ch|当前字体中 **数字“0”** 的宽度|常用于控制文本容器宽度（如 max-width: 65ch），优化阅读体验。|

---

## **视口相对单位 (Viewport-relative Units)**

|**单位**|**参照物 & 计算方式**|
|---|---|
|vw|视口宽度：1vw = 1% 的视口宽度。|
|vh|视口高度：1vh = 1% 的视口高度。常用于全屏布局。|
|vmin|1vmin = 1% × min(视口宽度, 视口高度)。|
|vmax|1vmax = 1% × max(视口宽度, 视口高度)。|

---

## **百分比 (%) 单位详解**

|**CSS 属性**|**参照物**|**说明**|
|---|---|---|
|width / min-width / max-width|**父元素的 width**|最常见的流式布局用法。|
|height / min-height / max-height|**父元素的 height**|⚠️ 父元素必须有显式高度，否则百分比无效。|
|padding (四个方向)|**父元素的 width**|⚠️ 垂直方向也参考宽度，而不是高度。|
|margin (四个方向)|**父元素的 width**|同上，垂直方向也参考宽度。|
|left / right|**父元素的 width**|定位时计算基准。|
|top / bottom|**父元素的 height**|定位时计算基准，父元素需有明确高度。|
|font-size|**父元素的 font-size**|等同于 em，如 150% = 1.5em。|
|line-height|**元素自身的 font-size**|✅ 建议使用无单位值（如 1.5）以避免继承问题。|
|transform: translate()|**元素自身的宽/高**|如 translateX(50%) → 水平移动自身宽度的 50%。|
|border-radius|**元素自身的宽/高**|控制圆角，常用于生成圆/椭圆。|
|background-size / background-position|**元素自身的尺寸**|控制背景图缩放和定位。|

---
