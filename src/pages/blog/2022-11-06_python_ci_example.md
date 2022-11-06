---
layout: '../../layouts/BlogPost.astro'
title: 'Python 프로젝트를 위한 Continuous Integration Sample'
stack: 'Python'
description: ''
pubDate: 'Nov 06 2022'
heroImage: '/images/blog/python_ci.jpeg'
tags: ['Python']
writer: 'triumph1'
---

# CI 를 왜 해야되요?

스파르타에서 학생분들을 가르칠 때 제가 가장 강조했던 것이 CI 입니다. 그리고 동시에 많은 학생분들이 가장 약했던 것도 CI 입니다.
학생분들의 깃헙 리포지토리를 둘러보다가 보면 깃헙 액션이 전부 통과해 Action 탭이 초록색 체크 표시로 가득 차있는 리포지토리가 종종 보입니다. “이 친구들 참 잘 배웠는걸” 하고 액션을 클릭해 열어보면
- 
- 테스트 실행 부분만 주석 처리 되어 있다거나
- 테스트 슈트가 한 개도 없어서 CI가 성공 하는 경우

가 많았답니다.

그만큼 CI 가 어려워서, 또 왜 해야되는지 공감이 안 되서 CI가 어렵고 싫게 느껴졌을 것이라고 생각합니다.

# 사고를 막아주는 안전장치
데브 경수툰에서 배포 관련한 짤을 가져왔습니다.
CI 로 자동화 테스트를 돌리면 이런 문제가 생기는 것을 미연에 방지해줄 수 있습니다. (배포자 정신건강에 최고 ^^)

뭐든 처음이 어렵고, 하다보면 진정한 맛을 알게 되니까요, 제가 바로 실행할 수 있는 CI sample 을 만들어 보았습니다. 
CI 가 생소하고 어려운 분들이 편하게 돌려보시면서 감을 익혀보셨으면 좋겠습니다.

https://github.com/aliwo/python_continuous_Integration_sample
