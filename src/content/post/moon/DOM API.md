  
  
### 一、 获取/查询节点 (Selecting Elements)
这是最基础也是最频繁的操作，用于在 DOM 树中找到需要操作的元素。
1. `**document.getElementById(id)**`
    - **说明**: 通过元素的 `id` 属性获取单个元素，速度最快。ID 在整个文档中应该是唯一的。
    - **示例**: `const container = document.getElementById('main-container');`
2. `**document.getElementsByTagName(tagName)**`
    - **说明**: 通过标签名获取一个元素的集合 (HTMLCollection)。这是一个“实时”的集合，当 DOM 变化时，它会自动更新。
    - **示例**: `const allParagraphs = document.getElementsByTagName('p');`
3. `**document.getElementsByClassName(className)**`
    - **说明**: 通过类名获取一个元素的集合 (HTMLCollection)，同样是实时的。
    - **示例**: `const highlights = document.getElementsByClassName('highlight');`
4. `**document.querySelector(selector)**`
    - **说明**: **（非常常用）** 使用 CSS 选择器语法获取匹配的**第一个**元素。功能强大且灵活。
    - **示例**: `const firstItem = document.querySelector('#list .item');`
5. `**document.querySelectorAll(selector)**`
    - **说明**: **（非常常用）** 使用 CSS 选择器语法获取匹配的**所有**元素，返回一个静态的 NodeList。它不是实时的，不会随 DOM 变化而自动更新。
    - **示例**: `const allItems = document.querySelectorAll('#list .item');`
---
### 二、 修改节点 (Modifying Elements)
获取到元素后，我们通常需要修改它的内容、样式或属性。
1. `**element.innerHTML**`
    - **说明**: 获取或设置一个元素内部的 HTML 内容。可以解析 HTML 标签。
    - **注意**: 直接设置 `innerHTML` 时要注意 XSS (跨站脚本) 攻击风险。
    - **示例**: `container.innerHTML = '<h2>New Title</h2><p>New content.</p>';`
2. `**element.textContent**`
    - **说明**: 获取或设置一个元素及其所有后代的文本内容。它会自动转义 HTML 标签，因此更安全。
    - **示例**: `title.textContent = 'This is a safe title';`
3. `**element.style.property**`
    - **说明**: 直接修改元素的内联样式。CSS 属性名需要写成驼峰式 (camelCase)，例如 `background-color` 变成 `backgroundColor`。
    - **示例**: `container.style.backgroundColor = 'blue'; container.style.fontSize = '16px';`
4. `**element.setAttribute(name, value)**` **/** `**element.getAttribute(name)**`
    - **说明**: 设置或获取元素的属性。
    - **示例**: `const img = document.querySelector('img'); img.setAttribute('src', 'new_image.jpg');`
5. `**element.removeAttribute(name)**`
    - **说明**: 移除元素的某个属性。
    - **示例**: `const input = document.querySelector('input'); input.removeAttribute('disabled');`
---
### 三、 增、删、插节点 (Creating, Adding & Removing Elements)
动态地在页面上创建、添加或删除元素。
1. `**document.createElement(tagName)**`
    - **说明**: 创建一个指定标签名的新元素节点。
    - **示例**: `const newDiv = document.createElement('div');`
2. `**parentNode.appendChild(childNode)**`
    - **说明**: 将一个节点 `childNode` 添加到 `parentNode` 的子节点列表的末尾。
    - **示例**: `document.body.appendChild(newDiv);`
3. `**parentNode.insertBefore(newNode, referenceNode)**`
    - **说明**: 在 `referenceNode` 之前插入 `newNode`。
    - **示例**: `const container = document.getElementById('container'); const firstChild = container.firstChild; container.insertBefore(newDiv, firstChild);`
4. `**parentNode.removeChild(childNode)**`
    - **说明**: 从 `parentNode` 中移除一个子节点 `childNode`。
    - **示例**: `container.removeChild(someOldDiv);`
5. `**element.remove()**`
    - **说明**: **（现代、推荐）** 一个更简单的方法，直接在要删除的元素上调用即可。
    - **示例**: `const elementToRemove = document.getElementById('old-element'); elementToRemove.remove();`
6. `**element.append(...nodes)**` **/** `**element.prepend(...nodes)**`
    - **说明**: **（现代、推荐）** 更灵活的添加方法。可以在元素内部的末尾 (`append`) 或开头 (`prepend`) 添加多个节点或文本字符串。
    - **示例**: `const p = document.createElement('p'); container.append('Some text', p);`
---
### 四、 Class 操作 (Class Manipulation)
动态地添加、移除或切换元素的 CSS 类，是实现交互效果的关键。
1. `**element.className**`
    - **说明**: 获取或设置元素的 `class` 属性（一个字符串）。操作单个类不方便。
    - **示例**: `div.className = 'class1 class2';`
2. `**element.classList**`
    - **说明**: **（非常常用，推荐）** 返回一个元素的 `DOMTokenList`，提供了一系列方便的方法来操作类。
    - `**element.classList.add('className')**`: 添加一个类。
    - `**element.classList.remove('className')**`: 移除一个类。
    - `**element.classList.toggle('className')**`: 如果类存在则移除，不存在则添加。
    - `**element.classList.contains('className')**`: 检查是否包含某个类，返回 `true` 或 `false`。
    - **示例**: `div.classList.add('active'); div.classList.remove('hidden'); if (div.classList.contains('active')) { ... }`
---
### 五、 事件处理 (Event Handling)
让页面响应用户的操作（点击、滚动、键盘输入等）。
1. `**element.addEventListener(event, handler, options)**`
    - **说明**: **（现代标准，推荐）** 为元素添加一个事件监听器。可以为同一事件添加多个监听器。
    - `event`: 事件类型字符串，如 `'click'`, `'mouseover'`, `'keydown'`。
    - `handler`: 事件触发时执行的函数。
    - `options`: 可选参数对象，如 `{ once: true, capture: false, passive: true }`。
    - **示例**: `const btn = document.getElementById('myBtn'); btn.addEventListener('click', () => { alert('Button clicked!'); });`
2. `**element.removeEventListener(event, handler)**`
    - **说明**: 移除通过 `addEventListener` 添加的事件监听器。注意，移除时传入的 `handler` 必须是添加时的同一个函数引用。
    - **示例**: `btn.removeEventListener('click', handleClickFunction);`
---
### 六、 节点遍历 (DOM Traversal)
从一个已知节点出发，导航到其父、子或兄弟节点。
- `**node.parentNode**`: 获取节点的父节点。
- `**node.parentElement**`: 获取节点的父**元素**节点（通常与 `parentNode` 相同，但更常用）。
- `**node.childNodes**`: 获取包含所有子节点（包括文本节点、注释节点）的 NodeList。
- `**node.children**`: **（常用）** 获取只包含**元素**子节点的 HTMLCollection。
- `**node.firstChild**` **/** `**node.lastChild**`: 获取第一个/最后一个子节点（可能是文本节点）。
- `**node.firstElementChild**` **/** `**node.lastElementChild**`: **（常用）** 获取第一个/最后一个**元素**子节点。
- `**node.nextSibling**` **/** `**node.previousSibling**`: 获取下一个/上一个兄弟节点（可能是文本节点）。
- `**node.nextElementSibling**` **/** `**node.previousElementSibling**`: **（常用）** 获取下一个/上一个**元素**兄弟节点。
---
### 七、 尺寸与位置 (Dimensions & Position)
获取元素在页面中的大小和位置，常用于布局计算和动画。
1. `**element.getBoundingClientRect()**`
    - **说明**: **（非常有用）** 返回一个 `DOMRect` 对象，包含元素的大小及其相对于视口 (viewport) 的位置。包含 `left`, `top`, `right`, `bottom`, `x`, `y`, `width`, `height` 属性。
    - **示例**: `const rect = myElement.getBoundingClientRect(); console.log(rect.width, rect.top);`
2. `**element.offsetWidth**` **/** `**element.offsetHeight**`
    - **说明**: 获取元素的宽度/高度，包括内边距 (padding) 和边框 (border)。
3. `**element.clientWidth**` **/** `**element.clientHeight**`
    - **说明**: 获取元素的内部宽度/高度，只包括内边距 (padding)，不包括边框和滚动条。
4. `**element.scrollTop**` **/** `**element.scrollLeft**`
    - **说明**: 获取或设置元素内容垂直/水平滚动的像素数。