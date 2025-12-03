
```Javascript

/**
 * 函数柯里化（基础版）
 * @param {Function} fn - 需要被柯里化的函数
 * @param  {...any} oldArgs - (内部使用) 之前已经收集的参数
 */
function curry(fn, ...oldArgs) {
  // 返回一个新的函数，用于接收下一次的参数
  return function(...newArgs) {
    // 将旧参数和新参数合并
    const allArgs = [...oldArgs, ...newArgs];

    // 判断参数是否收集完毕
    if (allArgs.length >= fn.length) {
      // 如果参数足够，则执行原始函数 fn，并返回结果
      return fn.apply(this, allArgs);
    } else {
      // 如果参数不够，则递归调用 curry，保存当前所有参数，并返回一个等待接收更多参数的函数
      return curry(fn, ...allArgs);
    }
  }
}

// --- 测试 ---

// 1. 定义一个需要多个参数的函数
function add(a, b, c) {
  return a + b + c;
}

// 2. 使用 curry 进行柯里化
const curriedAdd = curry(add);

// 3. 多种调用方式
console.log(curriedAdd(1)(2)(3));     // 输出: 6
console.log(curriedAdd(1, 2)(3));   // 输出: 6
console.log(curriedAdd(1)(2, 3));   // 输出: 6
console.log(curriedAdd(1, 2, 3));   // 输出: 6

// 4. 创建一个预设参数的函数
const add5 = curriedAdd(5);
console.log(add5(1, 2));            // 输出: 8
console.log(add5(3)(4));            // 输出: 12



```