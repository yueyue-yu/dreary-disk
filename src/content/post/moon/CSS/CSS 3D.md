---
title: CSS 3D
description: 系统讲解 CSS 3D：perspective、各类 transform、transform-style、transform-origin 与 backface-visibility 的作用与用法，并结合过渡/动画与常见交互示例。
publishDate: 2025-07-26
tags:
  - CSS
draft: false
---
### 1. `perspective` (透视)
- **作用**: 定义了 3D 元素的透视深度，即“相机”到 Z=0 平面的距离。它决定了 3D 变换的强度。没有 `perspective` 属性，`translateZ` 等 3D 变换函数将看起来像 2D 缩放。
- **位置**: 通常应用于要呈现 3D 效果的**父容器元素**。所有子元素的 3D 变换都将基于这个透视点。
- **值**: 一个长度值（例如 `800px`）。值越小，透视效果越强烈（离得越近，物体在 Z 轴上的位移看起来变化越大）；值越大，透视效果越弱（离得越远，接近正交投影）。
- **示例**:
    
    ```CSS
    .container {
        perspective: 800px; /* 相机距离观察对象的平面800px */
    }
    ```
    
### 2. `transform` (变换)
`transform` 属性用于对元素进行 2D 或 3D 变换。在 3D 方面，它提供了以下函数：
- `**translate3d(tx, ty, tz)**` **/** `**translateX(tx)**` **/** `**translateY(ty)**` **/** `**translateZ(tz)**`:
    - **作用**: 沿着 X、Y、Z 轴移动元素。
    - `tz` (Z 轴位移) 是实现深度效果的关键。正值表示向观察者方向移动（靠近），负值表示远离。
    - **示例**: `transform: translateZ(100px); /* 元素向外移动100px */`
- `**rotate3d(x, y, z, angle)**` **/** `**rotateX(angle)**` **/** `**rotateY(angle)**` **/** `**rotateZ(angle)**`:
    - **作用**: 围绕 X、Y、Z 轴旋转元素。
    - `rotateX()`: 绕 X 轴旋转（就像一个门上下摆动）。
    - `rotateY()`: 绕 Y 轴旋转（就像一个门左右摆动）。
    - `rotateZ()`: 绕 Z 轴旋转（就像一个风车）。
    - `angle` 可以是 `deg` (度), `rad` (弧度) 等。
    - **示例**: `transform: rotateY(45deg); /* 元素绕Y轴旋转45度 */`
- `**scale3d(sx, sy, sz)**` **/** `**scaleX(sx)**` **/** `**scaleY(sy)**` **/** `**scaleZ(sz)**`:
    - **作用**: 沿着 X、Y、Z 轴缩放元素。
    - `sz` (Z 轴缩放) 相对较少使用，因为在透视中 Z 轴的缩放效果通常由 `perspective` 和 `translateZ` 间接控制。
    - **示例**: `transform: scaleZ(2); /* 元素在Z轴上放大两倍，实际效果不明显 */`
- `**matrix3d()**`:
    - **作用**: 2D `matrix()` 的 3D 版本，允许通过 4x4 矩阵定义复杂的 3D 变换。通常用于高级场景或动画库生成。
### 3. `transform-style` (变换样式)
- **作用**: 指定嵌套元素如何呈现在其 3D 场景中。这是创建复杂 3D 结构（如立方体）的关键。
- **位置**: 应用于具有 3D 变换子元素的**父容器**。
- **值**:
    - `flat` (默认值): 所有子元素都将被“扁平化”到父元素的 2D 平面中。即使子元素有 3D 变换，它们也无法形成真正的 3D 结构。
    - `preserve-3d`: 子元素将保留它们自己的 3D 空间，形成一个真正的 3D 场景。
- **示例**:
    
    ```CSS
    .cube-wrapper {
        perspective: 1000px;
    }
    .cube {
        transform-style: preserve-3d; /* 确保立方体的六个面保持3D关系 */
    }
    ```
    
### 4. `transform-origin` (变换原点)
- **作用**: 设置元素变换（旋转、缩放等）的原点。默认是元素的中心（`50% 50% 0`）。
- **值**:
    - 可以是关键词（`top`, `left`, `right`, `bottom`, `center`）。
    - 可以是长度或百分比（`x-offset y-offset z-offset`）。
    - `z-offset` 用于在 Z 轴上移动变换原点，这对于绕非元素中心轴旋转非常有用。
- **示例**:
    
    ```CSS
    .card {
        transform-origin: center center -100px; /* 绕Z轴负100px处旋转 */
    }
    ```
    
### 5. `backface-visibility` (背面可见性)
- **作用**: 指定当元素背面朝向观察者时，是否可见。在 3D 翻转卡片等效果中非常有用。
- **值**:
    - `visible` (默认值): 背面可见。
    - `hidden`: 背面不可见。
- **示例**:
    
    ```CSS
    .card-face {
        backface-visibility: hidden; /* 当元素翻转到背面时，隐藏内容 */
    }
    ```
    
---
### 3D 坐标系
理解 CSS 3D 的关键在于理解其坐标系：
- **X 轴**: 水平方向，向右为正。
- **Y 轴**: 垂直方向，向下为正。
- **Z 轴**: 深度方向，向观察者（屏幕外）为正，向屏幕内为负。
---
### 动画和过渡
CSS 3D 变换可以结合 `transition` 和 `animation` 属性，实现平滑的 3D 动画效果，如翻转卡片、旋转立方体、3D 轮播图等。
- `**transition**`: 用于在属性值改变时创建平滑过渡效果。
    
    ```CSS
    .box {
        transition: transform 0.5s ease-in-out;
    }
    .box:hover {
        transform: rotateY(180deg);
    }
    ```
    
- `**@keyframes**` **和** `**animation**`: 用于创建更复杂的、由多个步骤组成的动画。
---
### 常见应用场景
- **3D 翻转卡片**: 使用 `rotateY` 或 `rotateX` 结合 `backface-visibility`。
- **立方体 / 棱柱**: 利用 `transform-style: preserve-3d` 和多个面的 `translateZ` 及 `rotate` 组合。
- **3D 轮播图 / 相册**: 将多个元素排列成圆形或弧形，然后通过旋转父容器来切换。
- **视差滚动效果**: 利用 `translateZ` 实现元素的不同滚动速度。
- **增强用户界面交互**: 按钮按下时的 3D 凹陷效果，弹窗的 3D 弹出效果等。
---
### 限制和注意事项
- **不是真正的 3D 渲染**: CSS 3D 只是模拟透视，它没有光照、阴影、材质、碰撞检测等高级 3D 引擎的功能。复杂的 3D 模型需要 WebGL (Three.js 等库)。
- **性能**: 复杂的 3D 场景可能会消耗大量 GPU 资源，尤其是在移动设备上。需要注意优化，例如使用 `will-change` 属性提前通知浏览器进行优化。、
  
  
  
### 示例
下面是一个包含了多种常见 CSS 3D 变换效果的 HTML 文件。
1. **透视（Perspective）**: 3D 效果的基础。
2. `**rotate3d()**`: 围绕 X、Y、Z 轴进行 3D 旋转。
3. `**translate3d()**`: 在 3D 空间中移动。
4. **卡片翻转效果**: `rotateY` 和 `backface-visibility` 的经典组合。
5. **3D 立方体**: 一个稍微复杂但非常酷的例子，综合运用了多种 3D 变换。
```HTML
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSS 3D Transform 综合示例</title>
  <style>
    /* --- 全局和基础样式 --- */
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: \#f0f2f5;
      color: #333;
      padding: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 50px;
    }
    h2 {
      text-align: center;
      color: \#1a253c;
      border-bottom: 2px solid \#6c5ce7;
      padding-bottom: 10px;
    }
    /* --- 场景容器 (The Scene/Stage) --- */
    .scene {
      width: 200px;
      height: 200px;
      margin: 20px auto;
      border: 1px dashed \#aaa;
      /* 关键: 为子元素创建 3D 透视空间 */
      perspective: 800px;
    }
    /* --- 通用变换对象样式 --- */
    .shape {
      width: 100%;
      height: 100%;
      background-color: \#6c5ce7;
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 24px;
      font-weight: bold;
      transition: transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    /* --- 1. 3D 旋转 (Rotate 3D) --- */
    .scene.rotate-scene:hover .shape {
      /* 绕 X 轴旋转 90 度 (像烤肉串一样上下翻滚) */
      transform: rotateX(90deg);
    }
    .scene.rotate-y-scene:hover .shape {
        /* 绕 Y 轴旋转 90 度 (像旋转门一样) */
        transform: rotateY(90deg);
    }
    /* --- 2. 3D 平移 (Translate 3D) --- */
    .scene.translate-scene:hover .shape {
      /* 在 Z 轴上移动，使其“靠近”观察者 */
      transform: translateZ(150px);
    }
    /* --- 3. 卡片翻转 (Card Flip) --- */
    .card-scene {
      width: 250px;
      height: 350px;
      perspective: 1000px;
    }
    .flipper {
      width: 100%;
      height: 100%;
      position: relative;
      transition: transform 0.8s;
      /* 关键: 让子元素保持 3D 状态 */
      transform-style: preserve-3d;
    }
    .card-scene:hover .flipper {
      transform: rotateY(180deg);
    }
    .card-face {
      position: absolute;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 20px;
      box-sizing: border-box;
      border-radius: 12px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.15);
      /* 关键: 隐藏元素的背面 */
      backface-visibility: hidden;
    }
    .card-front {
      background: linear-gradient(45deg, \#fd79a8, \#a29bfe);
    }
    .card-back {
      background: linear-gradient(45deg, \#55efc4, \#00b894);
      /* 预先翻转 180 度 */
      transform: rotateY(180deg);
    }
    /* --- 4. 3D 立方体 (3D Cube) --- */
    .cube-scene {
      width: 200px;
      height: 200px;
      perspective: 1200px;
    }
    .cube {
      width: 100%;
      height: 100%;
      position: relative;
      transform-style: preserve-3d;
      transition: transform 1.5s ease-in-out;
      transform: translateZ(-100px); /* 将立方体中心推到场景中心 */
    }
    .cube-scene:hover .cube {
      /* 鼠标悬停时，旋转立方体以展示各个面 */
      transform: translateZ(-100px) rotateX(-120deg) rotateY(150deg);
    }
    .cube-face {
      position: absolute;
      width: 200px;
      height: 200px;
      border: 2px solid \#1a253c;
      background-color: rgba(108, 92, 231, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 20px;
      color: white;
      font-weight: bold;
    }
    /*
      变换逻辑解释:
      - rotateX/Y: 将面旋转到正确方向
      - translateZ: 将面从中心点向外推出 (立方体边长的一半)
    */
    .cube-face-front  { transform: rotateY(0deg)   translateZ(100px); }
    .cube-face-back   { transform: rotateY(180deg) translateZ(100px); }
    .cube-face-right  { transform: rotateY(90deg)  translateZ(100px); }
    .cube-face-left   { transform: rotateY(-90deg) translateZ(100px); }
    .cube-face-top    { transform: rotateX(90deg)  translateZ(100px); }
    .cube-face-bottom { transform: rotateX(-90deg) translateZ(100px); }
  </style>
</head>
<body>
  <h1>CSS 3D Transform 综合示例</h1>
  <p>将鼠标悬停在下方的元素上查看效果。</p>
  <!-- 示例 1: 3D 旋转 -->
  <div>
    <h2>1. 3D 旋转 (Rotate 3D)</h2>
    <div class="scene rotate-scene">
      <div class="shape">RotateX</div>
    </div>
    <div class="scene rotate-y-scene">
        <div class="shape">RotateY</div>
      </div>
  </div>
  <!-- 示例 2: 3D 平移 -->
  <div>
    <h2>2. 3D 平移 (Translate 3D)</h2>
    <div class="scene translate-scene">
      <div class="shape">TranslateZ</div>
    </div>
  </div>
  <!-- 示例 3: 卡片翻转 -->
  <div>
    <h2>3. 卡片翻转 (Card Flip)</h2>
    <div class="card-scene">
      <div class="flipper">
        <div class="card-face card-front">
          <h3>正面</h3>
          <p>鼠标悬停来翻转我！</p>
        </div>
        <div class="card-face card-back">
          <h3>背面</h3>
          <p>这就是 3D 变换的魅力！</p>
        </div>
      </div>
    </div>
  </div>
  <!-- 示例 4: 3D 立方体 -->
  <div>
    <h2>4. 3D 立方体 (3D Cube)</h2>
    <div class="cube-scene">
      <div class="cube">
        <div class="cube-face cube-face-front">Front</div>
        <div class="cube-face cube-face-back">Back</div>
        <div class="cube-face cube-face-right">Right</div>
        <div class="cube-face cube-face-left">Left</div>
        <div class="cube-face cube-face-top">Top</div>
        <div class="cube-face cube-face-bottom">Bottom</div>
      </div>
    </div>
  </div>
</body>
</html>
```
### 代码解释
1. **基础结构**:
    - `.scene` / `.card-scene` / `.cube-scene`: 这些是“舞台”容器。它们最重要的作用是设置 `perspective` 属性，为内部元素创建一个 3D 渲染环境。
    - `.shape` / `.flipper` / `.cube`: 这些是实际进行 3D 变换的对象。
    - `transition`: 应用于这些变换对象，使得状态变化时（如 `:hover`）动画能够平滑过渡。
2. **3D 旋转 (Rotate)**:
    - 通过 `:hover` 伪类，我们改变 `.shape` 的 `transform` 属性为 `rotateX()` 或 `rotateY()`。
    - 因为有 `perspective` 的存在，旋转看起来是立体的，而不是平面的。
3. **3D 平移 (Translate)**:
    - 通过 `:hover`，我们将 `.shape` 的 Z 轴坐标增加了 `150px` (`translateZ(150px)`)。
    - 这使得元素在视觉上向我们“靠近”，并且由于透视效果，它看起来变大了。
4. **卡片翻转 (Card Flip)**:
    - 这是最经典的 3D 示例。`.flipper` 容器设置了 `transform-style: preserve-3d`，这样它的子元素（正面和背面）才能存在于同一个 3D 空间中。
    - 背面 `.card-back` 预先被 `transform: rotateY(180deg)` 翻转过去。
    - 正反两面都设置了 `backface-visibility: hidden`，这样当它们的背面朝向我们时，它们就是不可见的。
    - 鼠标悬停在 `.card-scene` 上时，我们只旋转父容器 `.flipper`，从而同时带动了正面和背面的翻转。
5. **3D 立方体 (Cube)**:
    - 这是最复杂的一个。它的核心思想是：先创建 6 个面，然后通过 `transform` 将它们分别旋转并平移到立方体的正确位置。
    - `.cube` 容器同样设置了 `transform-style: preserve-3d`。
    - 每个 `.cube-face` 都通过 `position: absolute` 定位到容器中心。
    - 然后，对每个面应用两个变换：
        1. `rotateX()` 或 `rotateY()`：将面旋转到正确的朝向（前、后、左、右、上、下）。
        2. `translateZ(100px)`：将旋转好的面从中心点向外推出。`100px` 是立方体边长（200px）的一半。
    - 鼠标悬停时，我们旋转整个 `.cube` 容器，让你能从不同角度欣赏这个立体结构。
/
---
