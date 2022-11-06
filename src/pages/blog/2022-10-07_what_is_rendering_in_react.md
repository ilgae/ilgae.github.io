---
layout: '../../layouts/BlogPost.astro'
title: 'Rendering 이란 무엇인가'
stack: 'React'
description: ''
pubDate: 'Oct 07 2022'
heroImage: '/images/placeholder/react.jpg'
tags: ['react']
writer: 'dorage'
---

## 원문

[Blogged Answers: A (Mostly) Complete Guide to React Rendering Behavior](https://blog.isquaredsoftware.com/2020/05/blogged-answers-a-mostly-complete-guide-to-react-rendering-behavior/)

## Rendering 이란?

현재 props와 state 를 기반으로 React가 component 에게 어떤 것을 그리려고 하는지 확인하는 과정이다.

## Renndering Process 개요

렌더링 프로세스에서 React는 컴포넌트 트리의 루트부터 시작하여 업데이트가 필요한 flagged component 를 찾는 과정을 가진다. 각 flagged component데 대하여 React는 FunctionCompoent(props) (for function components), 혹은 classComponentInstance.render() (for class components) 를 호출하고, 다음 과정을 위하여 결과 값인 render output을 저장한다.

render output은 대개로 JSX 구문으로 쓰여지며, JS가 컴파일되고 배포가 준비되면 React.createElement()로 변환된다. createElement는 의도된 UI의 구조를 설명할 javscript plain object를 반환한다.

```jsx
// This JSX syntax:
return <MyComponent a={42} b="testing">Text here</MyComponent>

// is converted to this call:
return React.createElement(MyComponent, {a: 42, b: "testing"}, "Text Here")

// and that becomes this element object:
{type: MyComponent, props: {a: 42, b: "testing"}, children: ["Text Here"]}

// And internally, React calls the actual function to render it:
let elements = MyComponent({...props, children})

// For "host components" like HTML:
return <button onClick={() => {}}>Click Me</button>
// becomes
React.createElement("button", {onClick}, "Click Me")
// and finally:
{type: "button", props: {onClick}, children: ["Click me"]}
```

모든 컴포넌트에서 render output이 수집되면, React는 새롭게 만들어진 Virtual DOM를 비교하고, 실제 DOM을 현재 output처럼 보이게 하기 위해 적용되어야 할 변경점 리스트를 수집한다. 이러한 비교와 계산을 거치는 과정이 **재조정(Reconciliation)**이 된다.

React는 모든 계산된 변경점을 한 번의 동기적 절차에(one synchronous sequence) 실제 DOM에 적용한다.

## Render 와 Commit 단계

React팀은 렌더링을 개념적으로 두 단계로 분리한다.

-   **Render Phase**
    **모든 컴포넌트들을 렌더링하고 변경점을 계산하는 과정**
-   **Commit Phase**
    **변경점을 DOM에 적용하는 과정**

React가 DOM을 Commit Phase에서 업데이트 한 후, 모든 refs가 요청된 DOM노드 및 컴포넌트 인스턴스를 가리키도록 업데이트한다. 그리고 동기적으로 class lifecycle method 인 componentDidMount 와 componentDidUpdate를, useLayoutEffect hook을 실행시킨다.

그 다음, React는 짧은 시간 초과를 설정하고 만료되면 useEffect hook을 실행시킨다. 이 과정은 “Passive Effects” phase 로 알려져 있다.

React 18은 useTransition과 같은 “Concurrent Renedering” 이 추가되었다. 이 기능은 React가 rendering phase를 멈추고 browser가 이벤트들을 처리할 수 있도록 허용하는 효과를 준다. React는 렌더링 단계를 재개할 수도 있고, 폐기할 수도 있고 또는 적절한 시기에 재계산을 할 수도 있다. 한 번 render pass가 완료되면, React는 한 단계에(in one step) commit phase 를 동기적으로 실행한다.

이 부분에서 중요한 것은 “Rendering”이라고 하는 것이 단순히 “DOM을 업데이트 하는 것” 이 아니라는 것이다. 컴포넌트는 어떠한 시각적 변경점이 없이 렌더링 될 수도 있다.

React는 다음과 같은 때 component를 렌더링한다.

-   The component might return the same render output as last time, so no changes are needed
-   In Concurrent Rendering, React might end up rendering a component multiple times, but throw away the render output each time if other updates invalidate the current work being done

![Untitled](/images/blog/react-hook-flow.png)
