---
title: DOM 事件流
description: 讲解捕获-目标-冒泡三阶段的传播路径与监听方式，结合示例观察执行顺序，并引出事件委托在冒泡阶段的应用。
publishDate: 2025-07-10
tags:
  - JavaScript
draft: false
---
### 1. 捕获阶段 (Capturing Phase)
这个阶段是事件从 DOM 树的顶端向目标元素传播的过程。
- **行为：**
    - 事件从 `window` 对象开始，依次经过 `document`、`<html>`、`<body>`，然后逐级向下穿过目标元素的每一个祖先元素，直到到达目标元素的**父元素**为止。
    - 此阶段的**主要任务是“探路”**，为事件的传递确定路径。
    - 默认情况下，**在此阶段注册的事件监听器不会被触发**。浏览器只是默默地完成这个传播过程。
- **如何利用这个阶段：**
    - 如果你希望在捕获阶段就拦截并处理事件，你需要在调用 `addEventListener` 时，将第三个参数设置为 `true`。
    - `element.addEventListener('click', myFunction, true);`
    - 这在某些高级应用场景中很有用，例如，你想在子元素处理事件**之前**，由父元素先进行某些统一的操作或阻止。
**总结：** 默认静默的向下传播过程。除非明确要求，否则此阶段不执行任何事件处理代码。
---
### 2. 目标阶段 (Target Phase)
这是事件传播的核心，事件到达了它最初被触发的源头。
- **行为：**
    - 事件已经到达并“停留”在目标元素上（例如，用户直接点击的那个按钮）。
    - 浏览器会检查该目标元素自身是否注册了对应类型的事件监听器（无论是通过捕获还是冒泡模式注册的）。
    - 如果目标元素上有监听器，它们就会被触发执行。**这是事件处理的主要发生地。**
    - 在事件对象中，`event.target` 始终指向这个阶段的元素。
- **特殊说明：**
    - 虽然概念上分为三个阶段，但在实际执行中，目标阶段没有明确的“开始”和“结束”界限。可以认为，当事件到达目标元素时，捕获阶段结束，冒泡阶段即将开始。所有在目标元素上注册的监听器都会在这个时间点被调用。
**总结：** 事件到达目的地，执行直接绑定在目标元素上的处理函数。
---
### 3. 冒泡阶段 (Bubbling Phase)
这是最常见、也是默认的事件处理阶段，事件从目标元素向 DOM 树的顶端回溯。
- **行为：**
    - 事件从 `event.target`（目标元素）开始，逐级向其父元素、祖父元素等上传播，一直回到 `window` 对象。
    - 在向上传播的每一步中，浏览器都会检查当前元素是否注册了对应类型的事件监听器（在默认的冒泡模式下）。
    - 如果存在，该监听器就会被触发。
    - `addEventListener` 的第三个参数默认为 `false` 或不写，就意味着在冒泡阶段处理事件。
    - `element.addEventListener('click', myFunction, false);` 或 `element.addEventListener('click', myFunction);`
- **如何利用这个阶段：**
    - 这是**事件委托 (Event Delegation)** 的实现基础。通过在父元素上设置一个监听器，可以统一管理所有子元素的事件，因为子元素的事件最终会“冒泡”到父元素上。
**总结：** 默认的、从内向外的传播过程，逐级触发沿途的事件处理函数。
---
### 综合示例：观察三个阶段的行为
让我们用代码来直观地感受一下这三个阶段的行为和执行顺序。
```HTML
<div id="parent">
  父元素
  <p id="child">子元素（点击这里）</p>
</div>
```
```JavaScript
const parent = document.getElementById('parent');
const child = document.getElementById('child');
// 1. 在父元素上注册捕获阶段的监听器 (true)
parent.addEventListener('click', () => {
  console.log('父元素 - 捕获阶段');
}, true);
// 2. 在父元素上注册冒泡阶段的监听器 (false)
parent.addEventListener('click', () => {
  console.log('父元素 - 冒泡阶段');
}, false);
// 3. 在子元素（目标）上注册监听器
child.addEventListener('click', () => {
  console.log('子元素 - 目标阶段');
}, false); // 这里的 true/false 对目标元素影响不大
// 4. 在 document 上也注册监听器，观察完整的流程
document.addEventListener('click', () => {
  console.log('Document - 捕获阶段');
}, true);
document.addEventListener('click', () => {
  console.log('Document - 冒泡阶段');
}, false);
```
**当您点击 "子元素" 时，控制台的输出顺序将是：**
`Document - 捕获阶段 父元素 - 捕获阶段 子元素 - 目标阶段 父元素 - 冒泡阶段 Document - 冒泡阶段`
这个输出结果完美地展示了整个事件流：
1. **向下捕获**：事件从 `document` 走到 `parent`。
2. **到达目标**：事件到达 `child` 并执行其处理函数。
3. **向上冒泡**：事件从 `child`（虽然它自己没有冒泡监听器）冒泡到 `parent`，再到 `document`。
---
