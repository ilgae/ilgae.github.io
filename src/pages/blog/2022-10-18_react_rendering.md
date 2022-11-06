---
layout: '../../layouts/BlogPost.astro'
title: 'React는 어떻게 렌더링을 조정하는가?'
stack: 'React'
description: ''
pubDate: 'Oct 18 2022'
heroImage: '/images/placeholder/react.jpg'
tags: ['react']
writer: 'dorage'
---

## 원문

[Blogged Answers: A (Mostly) Complete Guide to React Rendering Behavior](https://blog.isquaredsoftware.com/2020/05/blogged-answers-a-mostly-complete-guide-to-react-rendering-behavior/#how-does-react-handle-renders)

| 영문        | 번역        |
| ----------- | ----------- |
| render      | 렌더링      |
| render pass | 렌더링 단계 |
| re-render   | 리렌더링    |
| side effect | 부수 효과   |

## Queuing Renders

초기 render가 완료 된 후 React에 리렌더링를 전달하는 다양한 방법이 있다.

-   함수형 컴포넌트
    -   useState 의 setter
    -   useReducer 의 dispatch
-   클래스 컴포넌트
    -   this.setState()
    -   this.forceUpdate()
-   기타
    -   ReactDOM 탑-레벨 render(<App>) 메서드를 호출하는 행위 (이는 루트 컴포넌트에서 forceUpdate()를 호출하는 행위와 동일하다)
    -   새로운 useSyncExternalStore 훅에서 트리거된 업데이트

함수형 컴포넌트는 forceUpate 메서드를 갖고 있지 않다.

하지만 useReducer 훅을 이용해 항상 증가하는 카운터를 만드는 것으로 forceUpdate와 같은 효과를 낼 수 있다.

```jsx
const [, forceRender] = useReducer((c) => c + 1, 0)
```

## Standard Render Behavior

<aside>
⚠️ **React의 기본적으로 parent component가 렌더링 될 때, 재귀적으로 모든 자식 컴포넌트가 렌더링 되게 동작한다.**

</aside>

예를 들어, A > B > C > D 로 이어지는 컴포넌트 트리가 존재할 때, 유저가 B에 버튼을 클릭하는 것으로 카운터를 증가 시킨다면 다음과 같은 렌더링 과정을 갖는다.

-   setState() in B, B의 리렌더링 요청을 queue에 넣는다
-   React는 트리의 꼭대기부터 렌더링을 시작한다.
-   React는 A를 확인하지만 업데이트가 필요하지 않으므로 넘어간다.
-   React는 B를 확인하고, 업데이트가 필요하니 렌더링을 한다. B는 <C /> 를 반환한다.
-   C는 업데이트가 필요하다는 표시가 없지만, B의 렌더링이 진행되었으므로 C를 렌더링하고 C는 <D /> 를 반환한다.
-   D 또한 업데이트가 필요하다는 표시가 없지만, D를 렌더링한다.

일반적인 렌더링 상황에서는 React는 단순히 props가 변경되었는지 신경 쓰지 않는다. 단순히 부모 컴포넌트가 렌더링 되었으니 자식 컴포넌트도 렌더링하게 된다.

이는 setState()를 루트 컴포넌트에서 호출하는 경우, 변경점이 없더라도 React가 컴포넌트 트리 내부의 모든 컴포넌트를 리렌더링하는 결과를 만들어낸다.

이러한 행위는, 이전 컴포넌트 트리와 동일한 렌더링 결과물을 만들어내고, DOM을 건드리지 않는다. 하지만 React는 렌더링을 진행하고 렌더링 결과물을 비교한다.

## Rules of React Rendering

React 렌더링의 가장 기본적인 규칙은 렌더링은 순수해야 하고 어떠한 부수 효과(side effect)도 일으키지 않아야 한다는 것이다.

-   렌더링 로직에서 하면 안되는 것들
    -   변수나 객체를 조작하는 일
    -   Math.random() 이나 Date.now() 와 같은 난수 값을 생성하는 일
    -   네트워크 요청
    -   state 업데이트
-   렌더링 로직에서 해도 되는 것들
    -   렌더링 과정에서 생긴 객체의 조작
    -   에러 발생 (Throw Errors)
    -   캐시 값과 같은 생성되지 않은 데이터의 초기화 지연

## Component Metadata and Fibers

React는 현재 앱에 존재하는 모든 컴포넌트 인스턴스들을 추적하는 내부 데이터 자료구조를 갖고 있고 “fiber” 라고 부른다.

fiber는 다음을 기술하기 위한 메타데이터 필드들을 갖고 있다.

-   컴포넌트 트리에서 렌더링 되어야 할 현재 컴포넌트의 타입
-   이 컴포넌트를 구성하고 있는 현재 props와 state
-   부모, 자식, 형제 컴포넌트 참조
-   React가 렌더링 프로세스를 추적하는데 사용하는 기타 내부 메타데이터

```jsx
export type Fiber = {
    // Tag identifying the type of fiber.
    tag: WorkTag,

    // Unique identifier of this child.
    key: null | string,

    // The resolved function/class/ associated with this fiber.
    // 복합적인 컴포넌트의 경우, 함수/클래스 컴포넌트 그 자체
    // div, span과 같은 호스트 컴포넌트의 경우, string이 된다.
    type: any,

    // Singly Linked List Tree Structure.
    child: Fiber | null,
    sibling: Fiber | null,
    index: number,

    // Input is the data coming into this fiber (arguments/props)
    // pendingProps는 실행 초기에 할당, memoizedProps는 실행 마지막에 할당된다.
    // 다음 pendingProps 가 memoizedProps와 같다면,
    // 이전 아웃풋을 재사용하라는 신호를 보내 불필요한 작업을 막는다.
    pendingProps: any,
    memoizedProps: any, // The props used to create the output.

    // A queue of state updates and callbacks.
    updateQueue: Array<State | StateUpdaters>,

    // The state used to create the output
    memoizedState: any,

    // Dependencies (contexts, events) for this fiber, if any
    dependencies: Dependencies | null,
}
```

**[추가참조]**

[https://github.com/acdlite/react-fiber-architecture](https://github.com/acdlite/react-fiber-architecture)

**[React 18의 Fiber 타입 정의]**

[react/ReactInternalTypes.js at v18.0.0 · facebook/react](https://github.com/facebook/react/blob/v18.0.0/packages/react-reconciler/src/ReactInternalTypes.js#L64-L193)

렌더링 과정에서 React는 fiber 객체의 트리를 반복 순회하며 업데이트된 트리를 구성한다.

**fiber 객체는 실제 컴포넌트의 props와 state 값을 저장한다.**

컴포넌트에서 props와 state를 사용할 때, React는 fiber 객체에 접근하여 가져온다. 클래스 컴포넌트의 경우는, 렌더링 전 fiber객체의 props의 참조를 컴포넌트 인스턴스의 props 프로퍼티에 할당한다. 그렇기에 this.props를 통해 접근이 가능하다.

그러한 의미로 컴포넌트들은 React fiber 객체의 씌워진 외관이다.

비슷하게, React의 hook 또한 컴포넌트의 fiber 객체에 linked list의 형태로 저장되기 때문에 작동이 가능하다. React가 함수형 컴포넌트를 렌더링 할 때, fiber의 hook description 객체들로 이루어진 linked list를 가져오고, 훅을 호출 할 때, hook description 객체에 저장된 값을 반환한다 (like state, dispatcher values for useReducer).

부모 컴포넌트가 주어진 자식 컴포넌트들을 처음으로 렌더링 할 때, React는 컴포넌트의 인스턴스를 추적할 fiber 객체를 생성한다. 클래스 컴포넌트의 경우는 실제 컴포넌트 인스턴스를 fiber 객체로 저장한다면 함수형 컴포넌트의 경우는 단순히 함수로서 호출한다.

```jsx
// class component
// https://github.com/facebook/react/blob/v18.0.0/packages/react-reconciler/src/ReactFiberClassComponent.new.js#L656
const instance = new Component(props)
// function component
// https://github.com/facebook/react/blob/v18.0.0/packages/react-reconciler/src/ReactFiberHooks.new.js#L428
const instance = Component(props)
```

## Component Types and Reconciliation

React는 최대한 많은 컴포넌트 트리와 DOM 구조를 재사용하여 리렌더링 과정을 효율적으로 진행하려고 노력한다.

그리고 이러한 과정은 [Reconciliation](https://reactjs.org/docs/reconciliation.html#elements-of-different-types) 문서에 소개되어 있다.

React는 Component의 type을 비교하여 만약 type이 변경되었다면 기존의 컴포넌트 트리를 버리고 새로운 컴포넌트 트리를 구성하게 된다. \* div → span / CompA → CompB

이 때, 비교는 === 을 통해 인스턴스의 reference를 비교하게 된다.

이 뜻은 컴포넌트를 렌더링 과정에서 생성하면 안된다는 것이다. 이는 항상 새로운 타입의 인스턴스를 만드는 행위이므로 항상 새로운 type의 Component로 인식을 하게된다.

## Keys and Reconciliation

Reconciliation 의 다른 과정은 형제 컴포넌트 간의 key 라는 prop 를 통해 컴포넌트 인스턴스의 고유한 식별자를 지정하고 이를 이용해 비교하는 과정이 있다.

key 는 실제 props가 아니다. 그렇기 때문에 key props를 사용한 컴포넌트 내부에서 props.key를 통해 접근을 시도해도 항상 undefined가 반환된다.

```jsx
todos.map((todo) => <TodoListItem key={todo.id} todo={todo} />)
```

## Render Batching and Timing

기본적으로 setState()는 React가 새로운 렌더링 과정을 시작하게 만든다. 동기적으로 실행하고 결과를 반환한다. 그러나 React 는 Render Batching 이라는 최적화 과정을 적용한다.

Render Batching 이란 setState()가 여러 번 실행될 경우 단 한 번의 렌더링 과정을 걸쳐서 결과물을 내놓는 것이다.

한 번의 event loop tick 을 자동적으로 batching 처리한다.

```jsx
import React, { useState } from 'react'

export function App(props) {
    const [counter, setCounter] = useState(0)
    console.log(counter) // 0 -> 2 -> 4
    const onClick = async () => {
        setCounter(1)
        setCounter(2)

        await new Promise((res) => {
            setTimeout(() => res(), 1000)
        })

        setCounter(3)
        setCounter(4)
    }
    return (
        <div className="App">
            <button onClick={onClick}>re-render</button>
        </div>
    )
}
```

위의 코드는 setCounter(0) 와 setCounter(1) 까지가 하나의 event loop tick 이 된다. 그리고 await 문과 setCounter(2), setCounter(3)가 하나의 event loop tick 이 된다.

따라서 총 2번의 리렌더링이 발생한다.

## Async Rendering, Closures, and State Snapshots

```jsx
const [counter, setCounter] = useState(0)

const onClick = () => {
    setCounter(1)
    console.log(counter) // 0, not 1
}
```

이는 가장 흔하게 하는 실수 중 하나이다.

React의 state는 비동기적으로 업데이트 된다. 이는 실제로 비동기적으로 업데이트 된다 라는 의미는 아니다. 왜냐하면 React의 rendering 작업은 동기적으로 동작하기 때문이다. 정확하게는 useState의 state는 일종의 인스턴스 생성 시점의 state의 snapshot으로 현재 업데이트하게 된 state가 가리키는 값과는 연결이 끊어진 상태가 되는 것이다. 그렇기 때문에 console.log로 useState의 setter로 state를 업데이트 한 후 확인해도 값은 인스턴스 생성 시점 당시의 값이 보이게 된다.

## Render Behavior Edge Cases

### Commit Phase Lifecycles

commit-phase 생명주기 메서드에는 componentDidMount, componentDidUpdate, useLayoutEffect 와 같은 엣지 케이스들이 있다. 이는 브라우저에 페인트 되기 전에 추가적인 로직을 실행할 수 있게 해준다.

일반적인 사용 사례는 다음과 같다.

-   처음에는 불완전한 데이터로 렌더링하는 경우
-   페이지 내에서 실제 DOM 노드의 사이즈를 ref를 통해 측정하는 경우
-   측정한 값을 통해 state를 할당하는 경우
-   업데이트 된 데이터로 즉각적으로 리렌더링 하는 경우

layout과정은 거치지만 실제로 브라우저에 paint 과정을 거치지 않기 때문에 최종 결과물 만을 유저에게 보여줄 수 있게 된다.

### Reconciler Batching Methods

React reconcilers(React DOM, React Native) 는 rendering batching 을 대체할 메서드들을 갖고 있다.

flushSync()와 같은 강제적으로 리렌더링을 일으킬 수 있는 메서드들이 존재한다.

[flushSync](https://beta.reactjs.org/apis/react-dom/flushSync)

### <StrickMode>

React는 개발과정에서 StrictMode 내부의 컴포넌트를 두 번 렌더링한다.

[Strict 모드 - React](https://ko.reactjs.org/docs/strict-mode.html)

### Setting State While Rendering

기본적으로 useState의 setter를 렌더링 과정 중에 호출하는 행위는 금지한다.

이는 지속적으로 리렌더링을 야기하고 React는 50번 정도의 시행을 한 뒤 Error를 던지게 된다.

하지만 단 한 가지 경우의 예외가 존재하는데, 해당 setter가 항상 시행되는 것이 아닌 조건에 따라 실행 되는 경우를 허용한다.

이 경우 현재 컴포넌트의 해당 state만 업데이트 되고 해당 컴포넌트만 동기적으로 리렌더링 하는 과정을 거치고 다음 컴포넌트의 렌더링이 진행된다.

이러한 테크닉은 리렌더링을 요구하거나 useEffect 안에서 setter 없이 prop change에 따라 즉각적으로 state 값을 업데이트 해야 할 때 사용될 수 있다.
