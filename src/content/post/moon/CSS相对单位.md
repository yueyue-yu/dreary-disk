title: "CSS 单位详解"
description: "总结字体相对单位（em/rem/ex/ch）、视口单位（vw/vh/vmin/vmax）与百分比在不同属性下的参照物及注意事项，助力可伸缩与响应式设计。"
publishDate: "2025-09-12"
tags: ["CSS", "单位", "rem", "vw", "百分比"]
draft: false
---

### **字体相对单位 (Font-relative Units)**

| 单位 (Unit) | 参照物 (Reference) | 核心特点与用途 |
| :--- | :--- | :--- |
| `em` | **双重参照**: <br> 1. **`font-size`**: 父元素的 `font-size`。 <br> 2. **其他属性** (`width`, `padding`等): 元素**自身**的 `font-size`。 | **缺点**：会产生层层嵌套的复合效应，导致计算复杂，难以维护。 |
| `rem` | **根元素** (`<html>`) 的 `font-size`。 | **优点**: 计算基准唯一，无复合效应，适合构建可伸缩的整站布局和字体系统。 |
| `ex` | 当前字体的 **"x-height"** (小写字母'x'的高度)。 | 适合需要与文本中小写字母高度对齐的场景，值随字体变化。 |
| `ch` | 当前字体中**数字 "0"** 的宽度。 | 适合用于限制容器宽度以达到最佳阅读行长 (如 `max-width: 65ch`)。 |

***

### **视口相对单位 (Viewport-relative Units)**

| 单位 (Unit) | 参照物 (Reference) & 计算方式 |
| :--- | :--- |
| `vw` | **视口宽度**: `1vw` = 1% 的视口宽度。 |
| `vh` | **视口高度**: `1vh` = 1% 的视口高度 (常用于全屏布局)。 |
| `vmin` | **视口宽度和高度中的较小者**: `1vmin` = 1% of `min(视口宽度, 视口高度)`。 |
| `vmax` | **视口宽度和高度中的较大者**: `1vmax` = 1% of `max(视口宽度, 视口高度)`。 |

***

### **百分比 (%) 单位详解**

| CSS 属性 | 参照物 (Reference) | 关键说明 |
| :--- | :--- | :--- |
| `width`, `min-width`, `max-width` | **父元素的 `width`** | 最常见的流式布局用法。 |
| `height`, `min-height`, `max-height` | **父元素的 `height`** | **重要**: 父元素必须有显式定义的高度，否则 `height: auto` 将导致百分比失效。 |
| `padding` (所有方向) | **父元素的 `width`** | **重要**: 垂直方向 (`padding-top`/`bottom`) 也参照**宽度**，非高度。 |
| `margin` (所有方向) | **父元素的 `width`** | **重要**: 垂直方向 (`margin-top`/`bottom`) 也参照**宽度**，非高度。 |
| `left`, `right` (定位) | **父元素的 `width`** | 用于绝对/相对/固定定位。 |
| `top`, `bottom` (定位) | **父元素的 `height`** | 用于绝对/相对/固定定位，父元素需有明确高度。 |
| `font-size` | **父元素的 `font-size`** | 效果等同于 `em` (例如 `150%` 等于 `1.5em`)。 |
| `line-height` | **元素自身的 `font-size`** | 推荐使用无单位的数值 (如 `line-height: 1.5`) 以避免继承问题。 |
| `transform: translate()` | **元素自身的 `width` / `height`** | `translateX(50%)` 指移动自身宽度的50%，常用于居中。 |
| `border-radius` | **元素自身的 `width` / `height`** | 用于创建圆形或椭圆角。 |
| `background-size`, `background-position`| **元素自身的尺寸** | 控制背景图的大小和位置。 |
