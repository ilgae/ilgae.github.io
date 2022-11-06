---
layout: '../../layouts/BlogPost.astro'
title: 'Context VS Redux'
stack: 'Redux'
description: ''
pubDate: 'Oct 25 2022'
heroImage: '/images/placeholder/redux.jpg'
tags: ['redux']
writer: 'dorage'
---

## 원문

[Blogged Answers: Why React Context is Not a "State Management" Tool (and Why It Doesn't Replace Redux)](https://blog.isquaredsoftware.com/2021/01/context-redux-differences/)

## TL;DR

### Context와 Redux는 같은 것인가?

전혀 다르고 사용하는 목적 또한 다르다

### Context는 상태 관리 도구인가?

Context는 의존성 주입을 위한 도구이다.

Context는 어떠한 것도 관리하지 않는다.

### Context와 useReducer를 같이 사용하는 것은 Redux를 대체할 수 있는가?

비슷한 부분과 겹치는 부분은 있지만, 역량에 큰 차이가 있다.

### 언제 Context를 사용해야 하는가?

-   자주 변하지 않는 단순히 값들을 전달할 때
-   Props Drilling 을 피하고 싶을 때
-   React로만 구현하고 싶을 때

### 언제 Redux를 사용해야 하는가?

-   앱의 많은 곳에서 필요로 하는 많은 전역 상태를 갖고 있을 때
-   앱 상태가 자주 업데이트 되어야 할 때
-   상태를 업데이트하는 로직이 복잡할 때
-   앱의 크기가 크고 여러 사람들과 함께 작업을 할 때
-   어플리케이션 내에서 상태가 언제, 왜, 어떻게 업데이트되는지 이해하고 싶고 상태의 변화를 확인하고 싶을 때
-   부수효과, 지속성, 데이터 직렬화를 관리하기 위한 강력한 기능이 필요할 때
