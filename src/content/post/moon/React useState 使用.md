---
type: Post
status: Published
date: 2025-07-12
tags:
  - 前端
category: 技术分享
---
### `useState` 的渲染时机
`useState` 的核心作用是让函数组件拥有自己的状态（state），并在状态变更时触发组件的重新渲染（re-render），从而更新 UI。
理解其渲染时机，关键在于理解 `set` 函数（如 `setCount`）的行为。
### 1. 何时触发渲染？
**核心原则：调用** `**set**` **函数来更新 state，是触发重新渲染的唯一正确方式。**
当你调用 `set` 函数时，你并不是在命令组件“立即渲染”，而是在“请求/调度”一次更新。React 会接收到这个请求，然后决定何时执行重新渲染。
### 2. 触发渲染的具体条件
调用 `set` 函数并不总是会引起重新渲染。React 会进行一次优化检查：
- **新旧 state 值对比**：React 使用 `Object.is` 算法来比较你传入的新 state 值和当前的 state 值。
- **值相同时，跳过渲染**：如果 `Object.is(newState, oldState)` 返回 `true`，React 会认为 state 没有变化，从而跳过这次更新，不会触发重新渲染。这是一个重要的性能优化。
```JavaScript
const [count, setCount] = useState(0);
// 假设当前 count 的值是 5
setCount(5); // 传入的值和当前值相同，React 会跳过这次渲染
// 假设当前 count 的值是 0
setCount(1); // 传入的值和当前值不同，React 会调度一次重新渲染
```
### 3. 状态更新的批处理（Batching）
这是一个非常重要的概念。为了性能，React 会将短时间内发生的多次 `set` 调用合并（批处理）成一次重新渲染。
- **React 17及之前**：批处理主要发生在 React 的事件处理函数中（如 `onClick`, `onChange`）。在 `setTimeout`, `Promise` 或原生 DOM 事件监听中，每次 `set` 调用都会触发一次单独的渲染。
- **React 18及之后（自动批处理）**：批处理是自动且全面的。无论 `set` 函数是在事件处理函数、`setTimeout`、`Promise` 还是其他异步操作中被调用，React 都会尽可能地将它们合并成一次渲染。
**示例（在 React 18 环境下）：**
```JavaScript
function Counter() {
  const [count, setCount] = useState(0);
  const [isToggled, setIsToggled] = useState(false);
  console.log("Component rendered");
  const handleClick = () => {
    // 这三个 state 更新会被批处理
    setCount(c => c + 1);
    setIsToggled(t => !t);
    // 即使你再加一个，也只会有一次渲染
    console.log("Updating state...");
  };
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={handleClick}>Click Me</button>
    </div>
  );
}
// 点击按钮后，控制台会输出：
// "Updating state..."
// "Component rendered"  <-- 只会输出一次！
```
**总结渲染时机：**
1. 调用 `set` 函数。
2. 传入的新值与旧值**不同**。
3. React 会将这个更新**调度**到更新队列中。
4. React 会对同一事件循环中的多个更新进行**批处理**。
5. 在当前执行栈清空后，React 会执行一次重新渲染，使用最新的 state 值来生成新的 UI。
---
### `useState` 的注意事项
这些是使用 `useState` 时必须遵守的规则和常见的“坑”。
### 1. State 的更新是异步的（Stale Closure / 闭包陷阱）
当你调用 `set` 函数后，组件内的 state 变量并不会立即改变。当前函数的执行上下文（闭包）中，state 变量仍然是旧的值。
**错误示例：**
```JavaScript
function Counter() {
  const [count, setCount] = useState(0);
  const handleClick = () => {
    setCount(count + 1); // 请求将 count 更新为 1
    console.log(count);  // ❌ 这里仍然会打印 0！
  };
  // ...
}
```
**为什么？** `handleClick` 函数在被创建时，捕获了当时的 `count` 值（为 0）。`setCount(count + 1)` 只是告诉 React “请在下次渲染时把 count 变成 1”，但并不会改变当前这次函数执行中的 `count` 变量。
**解决方案：**
- **使用函数式更新**：如果你的新 state 依赖于旧 state，强烈推荐使用函数式更新。这可以确保你总是基于最新的 state 进行计算，避免闭包陷阱。
    
    ```JavaScript
    // ✅ 正确的方式
    const handleClick = () => {
      // 多次调用也能正确累加
      setCount(prevCount => prevCount + 1);
      setCount(prevCount => prevCount + 1); // 最终 count 会增加 2
    };
    ```
    
- **使用** `**useEffect**`：如果你需要在 state 更新后执行某些操作（副作用），请使用 `useEffect`。
    
    ```JavaScript
    useEffect(() => {
      // 这个函数会在 count 更新并重新渲染后执行
      console.log('Count has been updated to:', count);
    }, [count]); // 依赖项数组是关键
    ```
    
### 2. 不要直接修改 State（Immutability / 不可变性）
对于对象或数组类型的 state，绝对不能直接修改它。你必须创建一个新的对象或数组。
**错误示例：**
```JavaScript
const [user, setUser] = useState({ name: 'Alice', age: 30 });
const handleUpdateName = () => {
  // ❌ 错误：直接修改了原始 state 对象
  user.name = 'Bob';
  setUser(user); // 传入的是同一个对象引用，React 认为 state 未改变，不会重新渲染！
};
```
**正确示例：**
```JavaScript
const [user, setUser] = useState({ name: 'Alice', age: 30 });
const handleUpdateName = () => {
  // ✅ 正确：使用展开语法(...)创建一个新对象
  const newUser = { ...user, name: 'Bob' };
  setUser(newUser);
};
```
**对于数组也是同理：**
- **添加**：`setList([...list, newItem])`
- **删除**：`setList(list.filter(item => item.id !== idToRemove))`
- **修改**：`setList(list.map(item => item.id === idToUpdate ? { ...item, value: 'new' } : item))`
### 3. 遵守 Hooks 的规则
`useState` 是一个 Hook，必须遵守所有 Hooks 的规则：
- **只能在函数组件的顶层调用**：不要在循环、条件判断（`if`）或嵌套函数中调用 `useState`。React 依赖于 Hooks 的调用顺序来关联 state 和组件实例。
- **只能在 React 函数组件或自定义 Hook 中调用**。
**错误示例：**
```JavaScript
function MyComponent({ shouldShow }) {
  if (shouldShow) {
    // ❌ 错误：在条件语句中调用 Hook
    const [name, setName] = useState('Alice');
  }
  // ...
}
```
### 4. 惰性初始 State（Lazy Initial State）
如果你的初始 state 需要通过一个昂贵的计算（例如，从 `localStorage` 读取并解析数据）来获得，这个计算不应该在每次渲染时都执行。
**低效的方式：**
```JavaScript
// expensiveCalculation() 会在每次组件重新渲染时都被调用
const [data, setData] = useState(expensiveCalculation());
```
**高效的方式（惰性初始化）：**
向 `useState` 传入一个函数。这个函数只会在组件的**初始渲染**时被调用一次。
```JavaScript
// ✅ 正确：expensiveCalculation 只会在第一次渲染时执行
const [data, setData] = useState(() => {
  const initialState = expensiveCalculation();
  return initialState;
});
```
1. `useState` 接收的参数是**一个函数**（在这里是一个箭头函数 `() => { ... }`）。
2. React 的 `useState` Hook 有一个特殊的行为：如果传入的初始值是一个**函数**，它就不会立即执行这个函数，而是会把这个函数看作是**一个“初始化器”（initializer）函数**。
3. 这个“初始化器”函数**只会在组件的首次渲染时被调用一次**，其返回值将作为 `state` 的初始值。
4. 在组件的**后续重新渲染时，这个初始化器函数不会再次执行**。`useState` 会直接返回之前已经存储的 `state` 值。
---
### 最终总结
|方面|核心要点|
|---|---|
|**渲染时机**|1. 调用 `set` 函数 **调度** 更新。2. 仅当新旧值**不同**时才触发。3. React 会**批处理**多次更新，通常只引发一次渲染。|
|**注意事项**|1. **异步更新**：不要期望 `set` 后立即获取新值，使用 `useEffect` 或函数式更新。2. **不可变性**：绝不直接修改对象或数组，永远创建新的。3. **Hooks 规则**：只在顶层调用。4. **惰性初始化**：对于昂贵的初始值计算，使用函数 `useState(() => ...)`。|