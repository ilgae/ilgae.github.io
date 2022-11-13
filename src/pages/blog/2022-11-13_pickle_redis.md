---
layout: '../../layouts/BlogPost.astro'
title: 'Redis 와 pickle 을 같이 사용할 떄 주의할 점'
stack: 'Python'
description: ''
pubDate: 'Nov 13 2022'
heroImage: '/images/blog/redis.png'
tags: ['python', 'pickle', 'redis']
writer: 'triumph1'
---

# 결론 부터
같은 디렉터리 안에 `person.py` 와 `run.py` 를 만들었습니다.
```python
# person.py
class Person:
    def __init__(self, age: int):
        self.age = age

# run.py
import asyncio
import pickle

from redis.asyncio import Redis  # 레디스가 설치된 상태에서 pip install "redis[hiredis]==4.3.4"
from person import Person


redis = Redis.from_url("redis://localhost:6379")

async def main() -> None:
    key = f"{str(Person)} hi"
    await redis.set(f"{str(Person)} hi", pickle.dumps(Person(27)))  # 여기가 중요. f"{str(Person)} hi"
    cache = await redis.get(key)
    print(pickle.loads(cache).age if cache else "못 찾음")  # 27 출력

asyncio.run(main())
```
pickle 된 객체를 레디스에 캐싱 할 때에는 그 key 에 class 의 위치도 같이 넣어주어야 합니다. `f"{str(Person)} hi"`


# 만약 key 가 클래스 위치를 포함하지 않는다면?
만약 key 에 클래스 위치가 들어가지 않는 경우에 어떤 문제가 발생할까요?
main 함수를 아래와 같이 수정해 보겠습니다.
```python
async def main() -> None:
    await redis.set("hi", pickle.dumps(Person(27)))
    cache = await redis.get("hi")
    print(pickle.loads(cache).age if cache else "못 찾음")  # 27 출력
```

한 번 실행 후에, set 부분을 지우겠습니다.
```python
async def main() -> None:
    cache = await redis.get("hi")
    print(pickle.loads(cache).age if cache else "못 찾음")  # 27 출력
```

다시 실행해 보면 get() 이 정상적으로 작동하는 것을 확인할 수 있습니다. (캐시 되었으니까요) 몇 번을 실행해도 동일합니다.

이제 리펙터링을 하는 상황을 가정하고 `person.py` 의 이름을 `person2.py` 로 변경합니다.

```python
# run.py
import asyncio
import pickle

from redis.asyncio import Redis  # 레디스가 설치된 상태에서 pip install "redis[hiredis]==4.3.4"
from person2 import Person


redis = Redis.from_url("redis://localhost:6379")

async def main() -> None:
    cache = await redis.get("hi")
    print(pickle.loads(cache).age if cache else "못 찾음")  # 27 출력

asyncio.run(main())
```
기존의 Person 클래스의 위치가 변경되었으므로 pickle 에서 person 을 찾지 못해 `ModuleNotFoundError` 가 발생합니다. (와 장애다 ^__^)

# 저도 몰랐습니다...
그래서 이 글을 보신 분들께서는 cache key 로 꼭 클래스 위치도 넣어서
리펙터링을 한 경우에는 과거의 캐시가 사용되지 않도록 해주시길 바랍니다 ㅎㅎ

