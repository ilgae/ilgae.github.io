---
layout: '../../layouts/BlogPost.astro'
title: 'Rendering Performance 개선'
stack: 'React'
description: ''
pubDate: 'Oct 18 2022'
heroImage: '/images/placeholder/react.jpg'
tags: ['react']
writer: 'dorage'
---

## 원문

[Blogged Answers: A (Mostly) Complete Guide to React Rendering Behavior](https://blog.isquaredsoftware.com/2020/05/blogged-answers-a-mostly-complete-guide-to-react-rendering-behavior/#improving-rendering-performance)

## 참조

[memo](https://beta.reactjs.org/apis/react/memo#updating-a-memoized-component-using-a-context)

---

### 결과물에 변화가 없음에도 불구하고, 렌더링 과정을 거치는 것은 의미 없는 일이다.

## Component Render Optimization Techniques

React 컴포넌트는 항상 순수한 렌더링 로직을 갖고 있어야 한다.

순수하다는 의미는 props, state, context가 이전과 동일하다면, 동일한 결과물을 출력해야 한다는 의미이다.

React에는 함수형 컴포넌트를 위한 memoize 기법과 훅이 있다.

React.memo 와 useMemo, useCallback 이다.

### props/state가 변경 되었을 때

state의 변경점이 감지되면 React는 해당 컴포넌트를 리렌더링하고 모든 자식 컴포넌트에 대하여 리렌더링을 실시하게 된다.

이 떄 아래 RenderCheck와 같은 컴포넌트는 변경점이 없음에도 부모 컴포넌트의 리렌더링으로 인하여 리렌더링이 진행되게 된다.

이를 memoize 하여 아래와 같이 변경점이 없을 경우 그대로 실행할 수 있게 끔 할 수 있다.

**React.memo**

```jsx
function RenderCheck() {
    console.log('rendered');
    return <></>;
}

const MemoizedRenderCheck = memo(RenderCheck);

function MemoizeCounter() {
  const [counter1, setCounter1] = useState(0);
  const [counter2, setCounter2] = useState(0);
  console.log(`${counter1} ${counter2} render`);

  const onClick1 = () => {
    setCounter1(counter1+1);
  };
  const onClick2 = () => {
    setCounter2(counter2+1);
  };

  **return (
    <div>
      <button onClick={onClick1}>click 1st</button>
      <button onClick={onClick2}>click 2nd</button>
      <RenderCheck />
    </div>
  );**
}
// 0 0 render
// rendered
// 1 0 render
// rendered
// 1 1 render
// rendered

**return (
    <div>
      <button onClick={onClick1}>click 1st</button>
      <button onClick={onClick2}>click 2nd</button>
      <MemoizedRenderCheck />
    </div>
  );**

// 0 0 render
// rendered
// 1 0 render
// 1 1 render

```

**useMemo**

아래의 경우는 useMemo 훅을 사용한 경우이다.

만약 컴포넌트가 자식 컴포넌트 레벨이 아닌 부모 컴포넌트 레벨에서 memoize를 하고 싶다면 다음과 같이 useMemo를 사용하여 부모 컴포넌트의 디펜던시에 기반하여 memoize가 가능하다.

```jsx
function MemoizeCounter() {
  const [counter1, setCounter1] = useState(0);
  const [counter2, setCounter2] = useState(0);
  const memoizedRenderCheck = useMemo(() => <RenderCheck/>, [counter2]);
  console.log(`${counter1} ${counter2} render`);

  const onClick1 = () => {
    setCounter1(counter1+1);
  };
  const onClick2 = () => {
    setCounter2(counter2+1);
  };

  **return (
    <div>
      <button onClick={onClick1}>click 1st</button>
      <button onClick={onClick2}>click 2nd</button>
      *<RenderCheck/>*
    </div>
  );**
}

// 항상 RenderCheck도 렌더링 과정을 거친다
// 0 0 render
// rendered
// 1 0 render
// rendered
// 1 1 render
// rendered

  **return (
    <div>
      <button onClick={onClick1}>click 1st</button>
      <button onClick={onClick2}>click 2nd</button>
      *{memoizedRenderCheck}*
    </div>
  );**

// useMemo로 counter2를 dependency로 넘겨주었기 때문에
// counter2의 업데이트가 있을때마다 렌더링이 발생한다.
// 0 0 render
// rendered
// 1 0 render
// 2 0 render
// 2 1 render
// rendered
```

또한, useMemo는 자식 컴포넌트에 props로 객체 참조를 넘겨줄 경우 활용할 수 있다. React는 재조정(Reconciliation) 과정을 진행할 때, props의 값을 Object.is 를 이용하여 비교한다.

이는 단순히 객체의 참조를 비교하기 때문에 다음과 같은 상황이 생긴다.

```jsx
Object.is({}, {}) === false // true
```

```jsx
function App(props) {
  const [name, setName] = useState("hello");
  const [age, setAge] = useState("");

  const onChangeName = (e) => {
    console.log('name has changed!');
    setName(e.target.value);
  };
  const onChangeAge = (e) => {
    console.log('age has changed!');
    setAge(e.target.value);
  };

  return (
    <div className="App">
      <label name="name">name</label>
      <input name="name" onChange={onChangeName} value={name} />
      <label name="age">age</label>
      <input name="age" onChange={onChangeAge} value={age} />
      **<MemoizedA person={{name}} />**
    </div>
  );
}

const MemoizedA = React.memo(CompA);

function CompA({ person}) {
  console.log("render A");
  return <div>my name is {person.name}</div>;
}

**// memoize를 했지만 리렌더링 과정에서 다른 객체가 생성되므로
// 같은 값을 가졌지만 자식 컴포넌트가 리렌더링 되는 상황**
// age has changed!
// render A
// age has changed!
// render A

	**const person = useMemo(() => ({ name }), [name]);
	...**
	**<MemoizedA person={person} />
// person 이라는 객체를 useMemo를 사용하여 메모이제이션 하는 것으로
// 해당 문제가 해결이 된다.**
// age has changed!
// age has changed!
```

### context가 변경 되었을 때

context의 변경은 의미가 조금 다르다.

context는 Provider 내의 컴포넌트 트리로 context가 전파된다.

따라서, context가 갖고 있는 값의 업데이트는 Provider 내의 모든 자식 컴포넌트 트리의 리렌더링을 야기한다.

```jsx
const context = createContext(1)

function App(props) {
    const [counter, setCounter] = useState(0)

    return (
        <div className="App">
            <context.Provider
                value={{ state: { counter }, action: { setCounter } }}
            >
                <CompA />
            </context.Provider>
        </div>
    )
}

function CompA() {
    console.log('render A')
    return <CompB></CompB>
}

function CompB() {
    console.log('render B')
    return <CompC></CompC>
}

function CompC() {
    console.log('render C')
    const {
        state: { counter },
        action: { setCounter },
    } = useContext(context)

    return <button onClick={() => setCounter(counter + 1)}>setter</button>
}

// render A
// render B
// render C
// render A
// render B
// render C
```

말단 컴포넌트가 context의 값을 변경할 경우 모든 컴포넌트가 리렌더링 된다.

이 또한 React.memo를 이용하여 memoize가 가능하다.

단, React는 context를 컨슘하는 컴포넌트를 찾기 위해 모든 서브 컴포넌트 트리를 확인하는 작업을 거칠 것이다.

하지만 리렌더링은 진행하지 않는다.

```jsx
const context = createContext();

function App(props) {
  const [counter, setCounter] = useState(0);

  return (
    <div className="App">
      <context.Provider value={{ state: { counter }, action: { setCounter } }}>
        **<MemoizedA />**
      </context.Provider>
    </div>
  );
}

**const MemoizedA = React.memo(CompA);**

// render A
// render B
// render C
// render C
// render C
```

## \***\*Specifying A Custom Comparison Function\*\***

React.memo 에는 두 번째 인자로 직접 props를 비교할 수 있는 compare 함수를 넘길 수 있다.

```jsx
React.memo(Component, (prevProps, nextProps) => {
    return prevProps === nextProps // 변경점이 없다면 true
})
```

```jsx
function App(props) {
  const [name, setName] = useState("덕배");

  const onChangeName = (e) => {
    console.log("name has changed!");
    setName(e.target.value);
  };

  return (
    <div className="App">
      <label name="name">덕배</label>
      <input name="name" type="radio" onChange={onChangeName} value={"덕배"} />
      <label name="name">철수</label>
      <input name="name" type="radio" onChange={onChangeName} value={"철수"} />
      <MemoizedA name={name} />
    </div>
  );
}

**// porps의 name의 length 가 같다면, 변경점이 없는 걸로 파악**
const MemoizedA = React.memo(CompA, **(prev, next) => {
  return prev.name.length === next.name.length;
}**);

function CompA({ name }) {
  console.log("render A");
  return <div>my name is {name}</div>;
}

// name has changed!
// name has changed!
// name has changed!
```

또한, 만약 props로 객체를 넘겨주는 경우, 객체에 대한 값의 비교를 철저히 해야 한다.

예를 들어, 이벤트 리스너를 넘겨준다는 가정 하에 해당 이벤트 리스너에 대한 체크가 이뤄지지 않는다면 아래와 같은 문제가 생길 수 있다.

```jsx
function App(props) {
  const [name, setName] = useState("덕배");

  const onChangeName = (e) => {
    console.log("name has changed!", e.target.value);
    setName(e.target.value);
  };

  return (
    <div className="App">
      <label name="name">덕배</label>
      <input name="name" type="radio" onChange={onChangeName} value={"덕배"} />
      <label name="name">철수</label>
      <input name="name" type="radio" onChange={onChangeName} value={"철수"} />
      <MemoizedA onClick={() => console.log(name)} static={"static"}/>
    </div>
  );
}

**// onClick에 대한 값의 변경점이 파악이 안된다면,
// 예전 state를 이용한 동작이 계속 되고
// 이는 예기치 못한 결과를 가져온다.**
const MemoizedA = React.memo(CompA, **(prev, next) => {
  return prev.static === next.static;
}**);

// 덕배
// name has changed! 철수
// 덕배
```
