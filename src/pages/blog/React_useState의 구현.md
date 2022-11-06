---
layout: '../../layouts/BlogPost.astro'
title: 'useState는 어떻게 구현이 되었을까?'
stack: 'React'
description: ''
pubDate: 'Oct 07 2022'
heroImage: '/images/placeholder/react.jpg'
tags: ['React']
writer: 'dorage'
---

면접 질문으로 받은 질문이다.

정말 단순한 예상으로는 아래와 같이 구현이 되었을 것이라 생각을 하지만 실제 구현은 어떻게 되었는지 모르고 있다.

```jsx
const useState = (state) => {
	let state = value;

	const setState = (newValue) => {
		if(Object.is(state, newValue) return;
		state = newValue;
		// render를 불러일으키는 함수
	}
	return [state, setState];
};
```

[Behind the hood implementation of useState react hook](https://rajatexplains.com/usestate-hook-behind-the-hood)

위 포스트에서는 다음과 같이 simplified 한 구현을 보이고 있다.

모듈 레벨의 clojure 인 것으로 추측된다.

```jsx
let componentHooks = [];
let currentHookIndex = 0;

// How useState works inside React (simplified).
function useState(initialState) {
    let pair = componentHooks[currentHookIndex];
    if (pair) {
        // This is not the first render,
        // so the state pair already exists.
        // Return it and prepare for next Hook call.
        currentHookIndex++;
        return pair;
    }

    // This is the first time we're rendering,
    // so create a state pair and store it.
    pair = [initialState, setState];

    function setState(nextState) {
        // When the user requests a state change,
        // put the new value into the pair.
        pair[0] = nextState;
        updateDOM();
    }

    // Store the pair for future renders
    // and prepare for the next Hook call.
    componentHooks[currentHookIndex] = pair;
    currentHookIndex++;
    return pair;
}
```

그래도 무언가 부족한 것이 있는 것 같다.

## React내의 구현

React 라이브러리에서는 다음과 같이 구현되어 있다.

```jsx
export function useState<S>(
    initialState: (() => S) | S
): [S, Dispatch<BasicStateAction<S>>] {
    const dispatcher = resolveDispatcher();
    return dispatcher.useState(initialState);
}
```

```jsx
// react-reconciler\src\ReactFiberHook.new.js
// useState의 원형
function mountState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  const hook = mountWorkInProgressHook();
  if (typeof initialState === 'function') {
    // $FlowFixMe: Flow doesn't like mixed types
    initialState = initialState();
  }
	**// 기본적인 State는 hook에 저장된다.**
  **hook.memoizedState = hook.baseState = initialState;**
  const queue: UpdateQueue<S, BasicStateAction<S>> = {
    pending: null,
    lanes: NoLanes,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: (initialState: any),
  };
  hook.queue = queue;

	**// bind 를 이용해 마지막 action 인자를 전달하지 않는다.
	// 이렇게 bind로 래핑한 dispatch 액션을 전달하게 된다.
	// 마지막 인자는 지연평가의 형태로 라이브러리를 사용하는
	// 개발자가 state값을 업데이트하기 위해 사용된다.**
  **const dispatch: Dispatch<
    BasicStateAction<S>,
  > = (queue.dispatch = (dispatchSetState.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ): any));**

  return [hook.memoizedState, dispatch];
}

// 2번째 요소로 주어지는 setState dispatcher
function dispatchSetState<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
) {
  if (__DEV__) {
    if (typeof arguments[3] === 'function') {
      console.error(
        "State updates from the useState() and useReducer() Hooks don't support the " +
          'second callback argument. To execute a side effect after ' +
          'rendering, declare it in the component body with useEffect().',
      );
    }
  }

  const lane = requestUpdateLane(fiber);

  const update: Update<S, A> = {
    lane,
    action,
    hasEagerState: false,
    eagerState: null,
    next: (null: any),
  };

  if (isRenderPhaseUpdate(fiber)) {
    enqueueRenderPhaseUpdate(queue, update);
  } else {
    const alternate = fiber.alternate;
    if (
      fiber.lanes === NoLanes &&
      (alternate === null || alternate.lanes === NoLanes)
    ) {
      // The queue is currently empty, which means we can eagerly compute the
      // next state before entering the render phase. If the new state is the
      // same as the current state, we may be able to bail out entirely.
      const lastRenderedReducer = queue.lastRenderedReducer;
      if (lastRenderedReducer !== null) {
        let prevDispatcher;
        if (__DEV__) {
          prevDispatcher = ReactCurrentDispatcher.current;
          ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
        }
        try {
          const currentState: S = (queue.lastRenderedState: any);
          const eagerState = lastRenderedReducer(currentState, action);
          // Stash the eagerly computed state, and the reducer used to compute
          // it, on the update object. If the reducer hasn't changed by the
          // time we enter the render phase, then the eager state can be used
          // without calling the reducer again.
          update.hasEagerState = true;
          update.eagerState = eagerState;
          if (is(eagerState, currentState)) {
            // Fast path. We can bail out without scheduling React to re-render.
            // It's still possible that we'll need to rebase this update later,
            // if the component re-renders for a different reason and by that
            // time the reducer has changed.
            // TODO: Do we still need to entangle transitions in this case?
            enqueueConcurrentHookUpdateAndEagerlyBailout(fiber, queue, update);
            return;
          }
        } catch (error) {
          // Suppress the error. It will throw again in the render phase.
        } finally {
          if (__DEV__) {
            ReactCurrentDispatcher.current = prevDispatcher;
          }
        }
      }
    }

    const root = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
    if (root !== null) {
      const eventTime = requestEventTime();
      scheduleUpdateOnFiber(root, fiber, lane, eventTime);
      entangleTransitionUpdate(root, queue, lane);
    }
  }

  markUpdateInDevTools(fiber, lane, action);
}
//
function mountWorkInProgressHook(): Hook {
  const hook: Hook = {
    memoizedState: null,

    baseState: null,
    baseQueue: null,
    queue: null,

    next: null,
  };

  if (workInProgressHook === null) {
    // This is the first hook in the list
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // Append to the end of the list
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}
```

간소화한다면 다음과 같이 나타낼 수 있을 것 같다.

```jsx
const fiber= {
	memoizedState: null;
}

const lastHook = fiber.memoizedState;

const useState = (initialValue) => {
	const hook = createStateHook();
	const dispatcher = createStateDispatcher.bind(null, fiber, hook);
	return [hook, dispatcher];
};

const createStateHook = () => {
	const hook = {
		// 현재 state
		memoizedState: null,
		// 초기 state
		baseState: null,
		// 다음 hook
		next: null,
	};

	if(lastHook) {
		fiber.memoizedState = lastHook = hook;
	} else {
		lastHook = lastHook.next = hook;
	}
	return lastHook;
};

const createStateDispatcher = (renderingFiber, hook, action) => {
	if(Object.is(action, hook.memoizedState)) {
		// render dom
	}
};
```

이제 React의 렌더링 과정을 알아볼 때가 된 것 같다.

Fiber가 무엇인지 궁금해졌다.
