---
layout: '../../layouts/BlogPost.astro'
title: 'Python 프로젝트를 위한 Continuous Integration Example'
stack: 'Python'
description: ''
pubDate: 'Nov 06 2022'
heroImage: '/images/placeholder/react.jpg'
tags: ['Python']
writer: 'triumph1'
---

# CI 를 왜 해야되요?

스파르타에서 학생분들을 가르칠 때 제가 가장 강조했던 것이 CI 입니다. 그리고 동시에 학생분들이 가장 약했던 것도 CI 입니다.
학생분들의 깃헙 리포지토리를 둘러보다가 보면 깃헙 액션이 전부 통과해 Action 탭이 초록색 체크 표시로 가득 차있는 리포지토리가 종종 보입니다. “이 친구들 참 잘 배웠는걸” 하고 액션을 클릭해 열어보면

- 테스트 실행 부분만 주석 처리 되어 있다거나
- 테스트 슈트가 한 개도 없어서 CI가 성공 하는 경우

가 많았답니다.

# CI가 어려운 분들을 위한 예시
그래서 CI 가 생소하고 어려운 분들을 위해 sample 을 만들었습니다.

https://github.com/aliwo/python_continuous_Integration_sample
