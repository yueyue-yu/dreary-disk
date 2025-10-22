---
title: React State 保留与重置
description: 围绕位置、类型与 key 三要素，说明 React 何时复用组件并保留状态，何时卸载并重置；覆盖条件渲染、不同类型与关键字强制重置的典型场景。
publishDate: 2025-07-12
tags:
  - React
draft: false
---
### 核心概念：位置、类型、Key
在解释这些规则之前，我们先明确三个核心概念：
1. **位置 (Position)**：指组件在虚拟 DOM 树中的位置。例如，在 `<App />` 组件中，`return <div><Header /><Content /></div>`，那么 `<Header />` 在 `div` 的第一个子节点位置，`<Content />` 在第二个。
2. **类型 (Type)**：指组件的构造函数（对于类组件）或函数本身（对于函数组件），或者 HTML 标签名（如 `'div'`, `'p'`）。
3. **Key**：一个特殊的字符串或数字 prop，用于给数组中的元素提供一个稳定的身份标识。
现在，我们逐一解析你提到的四个特性。
### 1. 同一位置，同一类型，props 改变 → 保留 (Preserved)

> 规则：当 React 在前后两次渲染中，发现同一位置的组件类型没有改变时，它会认为这是同一个组件实例。
- **行为**：
    1. React **不会**创建新的组件实例，而是复用现有的实例。
    2. 组件的内部状态（state）和生命周期（如 `useEffect` 的引用）都会被**保留**下来。
    3. React 会用新的 props 去更新这个组件实例，并触发相应的更新生命周期（如函数组件的重新执行，或类组件的 `componentDidUpdate`）。
    4. 最后，React 会对该组件的子元素进行递归的 diff 比较。
- **结果**：**更新 (Update) & 保留 (Preserved)**。这是一种最高效的更新方式。
- **代码示例**：
```JavaScript
// 假设有一个简单的计数器组件
function Counter({ initialCount }) {
  const [count, setCount] = React.useState(initialCount);
  return <p>Count: {count}</p>;
}
// 父组件
function App() {
  const [useAdvancedCounter, setUseAdvancedCounter] = React.useState(false);
  // 第一次渲染：<Counter initialCount={0} />
  // 点击按钮后，第二次渲染：<Counter initialCount={10} />
  return (
    <div>
      <button onClick={() => setUseAdvancedCounter(true)}>Use Advanced</button>
      <Counter initialCount={useAdvancedCounter ? 10 : 0} />
    </div>
  );
}
```
**分析**：  
当点击按钮后，`App` 组件重新渲染。React 看到 `<Counter />` 组件仍然在原来的位置，并且类型也是 `Counter`。
- **React 的判断**：“这还是那个 Counter，只是它的 `initialCount` prop 从 `0` 变成了 `10`。”
- **实际效果**：`Counter` 组件的实例被保留。它的 `count` 状态**不会**因为 `initialCount` 的改变而重置。组件会接收到新的 props 并重新渲染，但它的内部状态依然是它自己维护的那个 `count`。
---
### 2. 同一位置，不同类型 → 重置 (Reset)

> 规则：当 React 发现同一位置的组件类型发生了改变（例如从 <p> 变成了 <div>，或从 <Greeting> 变成了 <Farewell>），它会认为这是一个全新的组件。
- **行为**：
    1. React 会**卸载 (unmount)** 旧的组件。这会触发其清理副作用（如 `useEffect` 的返回函数或 `componentWillUnmount`）。
    2. 旧组件的内部状态（state）和 DOM 节点会被完全销毁。
    3. React 会在同一位置**挂载 (mount)** 一个全新的组件实例。这会触发其初始化的生命周期（如 `useEffect` 的首次执行或 `constructor` / `componentDidMount`）。
- **结果**：**重置 (Reset)**。旧组件被彻底销毁，新组件从零开始。
- **代码示例**：
```JavaScript
function Greeting() {
  React.useEffect(() => {
    console.log('Greeting mounted');
    return () => console.log('Greeting unmounted'); // 清理函数
  }, []);
  return <p>Hello!</p>;
}
function Farewell() {
  React.useEffect(() => {
    console.log('Farewell mounted');
    return () => console.log('Farewell unmounted');
  }, []);
  return <span>Goodbye!</span>;
}
function App() {
  const [showGreeting, setShowGreeting] = React.useState(true);
  return (
    <div>
      <button onClick={() => setShowGreeting(!showGreeting)}>Toggle</button>
      {/* 在同一位置，组件类型从 Greeting 切换到 Farewell */}
      {showGreeting ? <Greeting /> : <Farewell />}
    </div>
  );
}
```
**分析**：  
当点击按钮后，`showGreeting` 变为 `false`。
- **React 的判断**：“哦，原来这个位置是 `Greeting`，现在变成了 `Farewell`。它们是完全不同的东西。”
- **实际效果**：
    1. `Greeting` 组件被卸载，控制台打印 "Greeting unmounted"。它的所有状态和 DOM 都被销毁。
    2. `Farewell` 组件被创建并挂载，控制台打印 "Farewell mounted"。
---
### 3. 组件从树中被移除 → 重置 (Reset)

> 规则：这其实是第二条规则的特例。当一个组件因为条件渲染等原因不再被渲染时，它就从虚拟 DOM 树中被移除了。
- **行为**：与“不同类型”完全相同。组件被卸载，状态被销毁。如果将来条件再次满足，它会作为一个全新的实例被重新挂载。
- **结果**：**重置 (Reset)**。
- **代码示例**：
```JavaScript
function UserProfile() {
  const [name, setName] = React.useState('Guest');
  /* ... */
  return <div>Welcome, {name}</div>;
}
function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  return (
    <div>
      <button onClick={() => setIsLoggedIn(!isLoggedIn)}>
        {isLoggedIn ? 'Logout' : 'Login'}
      </button>
      {/* 当 isLoggedIn 为 true 时，UserProfile 才会被渲染 */}
      {isLoggedIn && <UserProfile />}
    </div>
  );
}
```
**分析**：
1. **Login**：当 `isLoggedIn` 从 `false` 变为 `true`，`<UserProfile />` 被挂载到 DOM 树中。
2. **Logout**：当 `isLoggedIn` 从 `true` 变为 `false`，`<UserProfile />` 从 DOM 树中被**移除**。它的实例被卸载，内部的 `name` 状态也随之销毁。
3. **再次 Login**：下次再登录时，会创建一个**全新的** `<UserProfile />` 实例，其 `name` 状态会重置为初始值 "Guest"。
---
### 4. 同一位置，同一类型，但 key 不同 → 重置 (Reset)

> 规则：key 是 React 用来识别兄弟元素中特定元素的“身份证”。即使在同一位置，类型也相同，但如果 key 发生了变化，React 仍然会认为这是一个全新的组件。
- **行为**：与“不同类型”完全相同。旧 `key` 对应的组件被卸载，新 `key` 对应的组件被挂载。
- **结果**：**重置 (Reset)**。
- **为什么需要这个规则？**
    1. **在列表中**：`key` 的主要用途是帮助 React 高效地更新列表（`map` 渲染）。它能识别出哪些元素是新增、删除或重新排序的，而不是简单地按位置进行比较。
    2. **强制重置组件**：这是一个非常有用的“技巧”。当你希望一个组件在某个 prop 改变时，完全重置其内部状态并重新挂载时，就可以用这个 prop 来作为它的 `key`。
- **代码示例**：
```JavaScript
// 这是一个有内部状态的组件
function VideoPlayer({ videoId }) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  React.useEffect(() => {
    console.log(`Initializing video for ID: ${videoId}`);
    // 假设这里有一些复杂的初始化逻辑，比如加载视频源
    return () => {
      console.log(`Cleaning up video for ID: ${videoId}`);
      // 清理资源
    };
  }, [videoId]); // 注意：即使有这个依赖，也无法重置 isPlaying 状态
  return (
    <div>
      <h3>Video ID: {videoId}</h3>
      <button onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  );
}
function App() {
  const [selectedVideo, setSelectedVideo] = React.useState('video_A');
  return (
    <div>
      <button onClick={() => setSelectedVideo('video_A')}>Select Video A</button>
      <button onClick={() => setSelectedVideo('video_B')}>Select Video B</button>
      {/* 使用 videoId 作为 key */}
      <VideoPlayer key={selectedVideo} videoId={selectedVideo} />
    </div>
  );
}
```
**分析**：  
当点击按钮从 "Video A" 切换到 "Video B" 时：
- **React 的判断**：
    - 位置没变，类型都是 `VideoPlayer`。
    - 但是 `key` 从 `"video_A"` 变成了 `"video_B"`。
    - “OK，这不是更新，这是一个全新的 `VideoPlayer`。”
- **实际效果**：
    1. `key="video_A"` 的 `VideoPlayer` 实例被**卸载**。控制台打印 "Cleaning up video for ID: video_A"。它的 `isPlaying` 状态（无论是什么）都被销毁。
    2. `key="video_B"` 的 `VideoPlayer` 实例被**挂载**。控制台打印 "Initializing video for ID: video_B"。它的 `isPlaying` 状态被重置为初始值 `false`。
**如果不用** `**key**`：如果不提供 `key`，React 会遵循第一条规则（同一位置，同一类型），只会更新 `videoId` prop。`VideoPlayer` 的 `isPlaying` 状态会被保留，这在切换视频时通常不是我们想要的行为。
### 总结
|场景 (Scenario)|React 的判断|行为|结果 (State & Instance)|
|---|---|---|---|
|**同一位置，同一类型**，`props` 改变|是同一个组件|更新 `props`，触发组件更新|**保留 (Preserved)**|
|**同一位置，不同类型**|是不同的组件|卸载旧组件，挂载新组件|**重置 (Reset)**|
|**组件从树中被移除**|组件已不存在|卸载组件|**重置 (Reset)**|
|**同一位置，同一类型，但** `**key**` **不同**|是不同的组件 (因为 `key` 是身份标识)|卸载旧 `key` 的组件，挂载新 `key` 的组件|**重置 (Reset)**|

---

### 🔑 Key 的重要作用：不加 Key 会怎么样？

`key` 属性是 React 在渲染列表时的"身份证系统"。虽然它看起来只是一个简单的字符串，但它对 React 的 diff 算法至关重要。让我们通过具体例子来看看不加 `key` 会导致什么问题。

---

#### **问题 1：性能问题 - React 无法高效复用 DOM**

> 没有 key 时，React 只能按位置进行简单匹配，无法识别元素的真实身份。

**场景**：在列表头部插入新元素

```javascript
function TodoList() {
  const [todos, setTodos] = React.useState([
    { id: 1, text: '学习 React' },
    { id: 2, text: '写文档' },
    { id: 3, text: '吃饭' }
  ]);

  const addTodo = () => {
    const newTodo = { id: Date.now(), text: '新任务' };
    setTodos([newTodo, ...todos]); // 在头部插入
  };

  return (
    <div>
      <button onClick={addTodo}>添加任务</button>
      {/* 情况 A：没有 key */}
      {todos.map(todo => (
        <div>{todo.text}</div>
      ))}
    </div>
  );
}
```

**React 的判断**（没有 key）：

1. 第一个位置：原来是 "学习 React"，现在是 "新任务" → 更新文本内容
2. 第二个位置：原来是 "写文档"，现在是 "学习 React" → 更新文本内容
3. 第三个位置：原来是 "吃饭"，现在是 "写文档" → 更新文本内容
4. 第四个位置：没有，现在是 "吃饭" → 创建新 DOM 节点

**实际效果**：React **更新了 3 个已存在的 DOM 节点 + 创建了 1 个新节点**，总共 4 次 DOM 操作。

**正确做法**（使用 key）：

```javascript
{todos.map(todo => (
  <div key={todo.id}>{todo.text}</div>
))}
```

**React 的判断**（有 key）：

- `key={1}` 的元素：位置从第一变成第二 → 移动 DOM 节点
- `key={2}` 的元素：位置从第二变成第三 → 移动 DOM 节点  
- `key={3}` 的元素：位置从第三变成第四 → 移动 DOM 节点
- `key={新ID}` 的元素：全新的 → 创建新 DOM 节点

**实际效果**：React **只创建了 1 个新 DOM 节点 + 移动了 3 个已存在的节点**。移动节点比更新节点内容要高效得多！

---

#### **问题 2：状态混乱 - 组件状态被错误复用**

> 当列表项有内部状态时，不加 key 会导致状态"串位"。

**场景**：可编辑的任务列表

```javascript
function EditableTodo({ text }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [value, setValue] = React.useState(text);

  return (
    <div>
      {isEditing ? (
        <input 
          value={value} 
          onChange={e => setValue(e.target.value)}
          onBlur={() => setIsEditing(false)}
        />
      ) : (
        <span onClick={() => setIsEditing(true)}>{value}</span>
      )}
    </div>
  );
}

function App() {
  const [todos, setTodos] = React.useState([
    { id: 1, text: '买牛奶' },
    { id: 2, text: '写代码' },
    { id: 3, text: '运动' }
  ]);

  const removeTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div>
      {/* 没有 key！*/}
      {todos.map(todo => (
        <div>
          <EditableTodo text={todo.text} />
          <button onClick={() => removeTodo(todo.id)}>删除</button>
        </div>
      ))}
    </div>
  );
}
```

**问题演示**：

1. 用户点击第二项 "写代码"，进入编辑模式（`isEditing = true`）
2. 用户删除第一项 "买牛奶"
3. **预期**：第二项（现在变成第一项）仍然保持编辑状态
4. **实际**：第二项（"运动"）进入了编辑模式！

**React 的判断**（没有 key）：

- 删除 "买牛奶" 后，列表从 3 项变成 2 项
- 第一个位置：原来是 `<EditableTodo text="买牛奶" />`，现在是 `<EditableTodo text="写代码" />` → 同一位置，同一类型，**保留实例**，只更新 `text` prop
- 第二个位置：原来是 `<EditableTodo text="写代码" />`（正在编辑），现在是 `<EditableTodo text="运动" />` → 同一位置，同一类型，**保留实例**（包括 `isEditing=true` 的状态！），只更新 `text` prop
- 第三个位置：原来有，现在没有了 → 卸载组件

**实际效果**：原本在编辑 "写代码" 的状态被错误地保留给了 "运动"！

**正确做法**（使用 key）：

```javascript
{todos.map(todo => (
  <div key={todo.id}>
    <EditableTodo text={todo.text} />
    <button onClick={() => removeTodo(todo.id)}>删除</button>
  </div>
))}
```

**React 的判断**（有 key）：

- `key={1}` 的组件被删除 → 卸载该实例
- `key={2}` 的组件（正在编辑）从第二位置移到第一位置 → **保留实例和状态**
- `key={3}` 的组件从第三位置移到第二位置 → 保留实例和状态

**实际效果**：每个组件的状态都正确地跟随其对应的数据项！

---

#### **问题 3：使用 index 作为 key 的陷阱**

很多开发者会用数组索引作为 `key`：

```javascript
{todos.map((todo, index) => (
  <div key={index}>{todo.text}</div>
))}
```

**这和不加** `**key**` **几乎一样糟糕！**

**为什么？** 因为当列表顺序改变时，索引值仍然保持不变（总是 0, 1, 2, ...），React 依然无法识别元素的真实身份。

|操作|使用 `key={index}`|使用 `key={todo.id}`|
|---|---|---|
|在列表头部插入|❌ 所有元素的 key 都变了（0→1, 1→2...），导致大量更新|✅ 只有新元素有新 key，其他元素不变|
|删除中间元素|❌ 删除位置之后的所有元素 key 都变了|✅ 只有被删除的元素消失，其他不变|
|随机排序|❌ 几乎所有元素的 key 都变了|✅ 所有元素的 key 保持不变，只是位置改变|

**唯一可以用** `**index**` **的情况**：

- 列表**永远不会**重新排序
- 列表**永远不会**删除/插入元素
- 列表项**没有内部状态**

但说实话，这种情况太少了，**强烈建议始终使用唯一的 ID 作为 key**。

---

#### **最佳实践总结**

|场景|推荐做法|原因|
|---|---|---|
|渲染数据库记录|使用数据库 ID (`key={item.id}`)|每条记录有唯一、稳定的标识|
|渲染用户输入的项|使用 UUID 或时间戳 (`key={item.uuid}`)|即使内容相同，每项也是独立的|
|静态列表（永不改变）|可以用 `index`，但用 ID 更安全|虽然可行，但不值得省这点代码|
|动态列表（会排序/过滤）|**必须**使用稳定的 ID|否则会导致性能和状态问题|

**记住**：`key` 不是给你看的，是给 React 看的。它帮助 React 识别"这个元素还是原来那个元素吗？"这个问题的答案直接决定了 React 是复用组件（保留状态）还是重新创建（重置状态）。

---
