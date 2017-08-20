### redux深入理解之中间件(middleware)

#### 理解`reduce`函数

> reduce() 方法接收一个函数作为累加器（accumulator），数组中的每个值（从左到右）开始缩减，最终为一个值。

```javascript
arr.reduce([callback, initialValue])
```

关于`reduce`的用法，这里不再做多述，可以去[这里](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce_clone)查看

看如下例子：

```javascript
let arr = [1, 2, 3, 4, 5];

// 10代表初始值，p代表每一次的累加值，在第一次为10
// 如果不存在初始值，那么p第一次值为1
// 此时累加的结果为15
let sum = arr.reduce((p, c) => p + c, 10);	// 25

// 转成es5的写法即为：
var sum = arr.reduce(function(p, c) {
  	console.log(p);
  	return p + c;
}, 10);
```

下面我们再来看一个`reduce`的高级扩展。现在有这么一个数据结构，如下：

```javascript
let school = {
	name: 'Hope middle school',
	created: '2001',
	classes: [
		{
			name: '三年二班',
			teachers: [
				{ name: '张二蛋', age: 26, sex: '男', actor: '班主任' },
				{ name: '王小妞', age: 23, sex: '女', actor: '英语老师' }
			]
		},
		{
			name: '明星班',
			teachers: [
				{ name: '欧阳娜娜', age: 29, sex: '女', actor: '班主任' },
				{ name: '李易峰', age: 28, sex: '男', actor: '体育老师' },
				{ name: '杨幂', age: 111, sex: '女', actor: '艺术老师' }
			]
		}
	]
};
```

比如我想取到这个学校的第一个班级的第一个老师的名字，可能你会这样写：

```javascript
school.classes[0].teachers[0].name
```

这样不就行了么？so easy!是哦，这样写"毫无问题"，这个毫无问题的前提是你已经知道了这个值确实存在，那么如果你不知道呢？或许你要这么写：

```javascript
school.classes &&
school.classes[0] &&
school.classes[0].teachers &&
school.classes[0].teachers[0] &&
school.classes[0].teachers[0].name
```

我去，好大一坨，不过要在深层的对象中取值的场景在工作中真真实实存在呀？怎么办？逛知乎逛到一个大神的[解决方案](https://zhuanlan.zhihu.com/p/27748589)，如下：

```javascript
const get = (p, o) => p.reduce((xs, x) => (xs && xs[x] ? xs[x] : null), o);

// call
get('classes', 0, 'teachers', 0, 'name', school);	// 张二蛋
```

是不是很简单，用`reduce`这个方法优雅地解决了这个问题。

#### 理解redux的`compose`函数

讲了这么久的reduce，这不是将redux么？这就尴尬了，下面我们就来看看为什么要讲这个`reduce`函数。去github上找到redux源码，会看到一个compose.js文件，带上注释共22行，其中就用到了reduce这个函数，那么这个函数是用来做啥的？可以看一看：

```javascript
export default function compose(...funcs) {
    if (funcs.length === 0) {
      return arg => arg
    }

    if (funcs.length === 1) {
      return funcs[0]
    }

    return funcs.reduce((a, b) => (...args) => a(b(...args)))
}
```

初步看上去貌似就是函数的嵌套调用。我们去搜一下，看哪个地方会用到这个函数，在源码中找一下，发现在`applyMiddleware.js`中发现了这样的调用：

```javascript
export default function applyMiddleware(...middlewares) {
    return (createStore) => (reducer, preloadedState, enhancer) => {
        const store = createStore(reducer, preloadedState, enhancer)
        let dispatch = store.dispatch
        let chain = []

        const middlewareAPI = {
          getState: store.getState,
          dispatch: (...args) => dispatch(...args)
        }
        chain = middlewares.map(middleware => middleware(middlewareAPI))
        dispatch = compose(...chain)(store.dispatch)

        return {
          ...store,
          dispatch
        }
    }
}
```

看到熟悉的东西了么？`applyMiddleware`哟，我们在写中间件必须要用的函数。我们来看一下一个简单的`middleware`是怎样写的？比如我要写一个`loggerMiddleware`，那么就像这样：

```javascript
const logger = store => next => action => {
  	console.log('action', action);
  	let result = next(action);
  	console.log('logger after atate', store.getState());
  	return result;
}
```

当我们创建了一个store的时候，我们是这样调用的：

```javascript
let middlewares = [loggerMiddleware, thunkMiddleware, ...others];
let store = applyMiddleware(middlewares)(createStore)(reducer, initialState);
```

那么传给compose的funcs实际上就是包含这样的函数的一个数组：

```javascript
function(next) {
  	return function(action) {
      	return next(action);
  	}
}
```

当把这样的一个数组传给compose会发生什么样的化学反应呢？稍微看一下应该不难看出，最终会返回一个函数，这个函数是通过了层层middleware的加工，最终的形态仍如上面的这个样子。注意，此时的`next(action)`并未执行，当执行了

```javascript
compose(...chain)(store.dispatch)
```

之后，返回的样子是这样的：

```javascript
function(action) {
  	return next(action);
}
```

各位看官们，看出了一点点什么东西了么？好像`createStore`中的dispatch呀，没错，这其实也是一个dispatch，只是这个dispatch正一触即发，再等待一个机会。我们有这么一个数量加1的action，类似这样的：

```javascript
export function addCount() {
    return {
        type : ADD_COUNT
    }
}

// 下面我们来触发一下
dispatch(addCount());
```

没错，此时的dispatch执行啦，最外层的dispatch执行了会发生什么样的反应呢？看下面：

```javascript
return next(action);

// 这个next就是dispatch函数，只不过这个dispatch函数在每次执行的时候，会保留
// 上一个middleware传递的dispatch函数的引用，因此会一直的传递下去，
// 直到最终的store.dispatch执行
```

那么我们去createStore中去看看dispatch函数的定义：

```javascript
function dispatch(action) {
      // ...

      try {
        	isDispatching = true
        	currentState = currentReducer(currentState, action)
      } finally {
        	isDispatching = false
      }

      // ...

      return action
  }
```

找到这一句

```javascript
currentState = currentReducer(currentState, action);
```

当执行了这一步的时候，这一刻，如本传递过来的initialState值已经改变了，那么就会层层执行middleware之后的操作，还记得我们在middleware中这样写了么:

```javascript
const logger = store => next => action => {
  	console.log('action', action);
  	let result = next(action);
  	console.log('logger after atate', store.getState());
  	return result;
}
```

这就是为什么我们会在next执行之后，会取到store中的state的原因。

#### 异步的middlewares

异步的action写法上可能会和立即执行的action不一样，例如是这样的：

```javascript
// 定义的非纯函数，提供异步请求支持
// 需要在sotre中使用thunkMiddleware
export function refresh() {
    return dispatch => {
        dispatch(refreshStart());
        return fetch(`src/mock/fetch-data-mock.json`)
            .then(response => response.json())
            .then(json => {
                setTimeout(() => {
                    dispatch(refreshSuccess(json && json.data.list));
                }, 3000);
            });
    }
}
```

为什么要使用thunkMiddleware呢，我们去找一找thunkMiddleware中到底写了什么？

```javascript
function createThunkMiddleware(extraArgument) {
    return ({ dispatch, getState }) => next => action => {
        if (typeof action === 'function') {
          	return action(dispatch, getState, extraArgument);
        }

        return next(action);
    };
}

const thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware;

export default thunk;
```

短短14行代码，看这一句：

```javascript
if (typeof action === 'function') {
  	return action(dispatch, getState, extraArgument);
}
```

如果action的类型为function的话，那么就直接执行啦，实际上就是将一个异步的操作转化成了两个立即执行的action，只是需要在异步前和异步后分别发送状态。为什么要分解呢？如果不分解会是什么样的情况？还记得这一行代码吗？

```javascript
currentReducer(currentState, action);
```

这里的reducer**只接受纯函数，只接受纯函数，只接受纯函数**，重要的事情说三遍。所以你传个非纯函数是个什么鬼？那不是直接走`switch`的`default`了么？所以得到的state依旧是之前的state，没有任何改变。

