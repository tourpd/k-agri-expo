#!/usr/bin/env python3
from pathlib import Path

BASE = Path("K-HOS/HUMANITY_BLACK_BOX/003_SOURCE_ARCHIVES/hwandangogi/events")
BASE.mkdir(parents=True, exist_ok=True)

SEEDS = [
("인간은 왜 자신의 기원을 찾는가?","무지 VS 기원","CURIOSITY,MEMORY,TRANSCENDENCE"),
("인간은 왜 하늘을 바라보는가?","현실 VS 초월","FAITH,TRANSCENDENCE,CURIOSITY"),
("인간은 왜 공동체를 만드는가?","고독 VS 연대","COMMUNITY,LOVE,RESPONSIBILITY"),
("인간은 왜 정의를 찾는가?","불의 VS 정의","RESPONSIBILITY,COMMUNITY,FAITH"),
("인간은 왜 질서를 만드는가?","혼돈 VS 질서","COMMUNITY,RESPONSIBILITY,FEAR"),
("인간은 왜 희생하는가?","이기심 VS 헌신","SACRIFICE,LOVE,RESPONSIBILITY"),
("인간은 왜 사랑하는가?","고립 VS 연결","LOVE,HOPE,COMMUNITY"),
("인간은 왜 희망을 포기하지 않는가?","절망 VS 희망","HOPE,COURAGE,LOVE"),
("인간은 왜 두려워하는가?","생존 VS 소멸","FEAR,HOPE,COMMUNITY"),
("인간은 왜 영웅을 기다리는가?","무력감 VS 구원","HERO,HOPE,RESPONSIBILITY"),
("인간은 왜 기억하려 하는가?","소멸 VS 기록","MEMORY,DEATH,HOPE"),
("인간은 왜 아이를 낳는가?","현재 VS 미래","BIRTH,LOVE,HOPE"),
("인간은 왜 아름다움을 찾는가?","혼란 VS 조화","BEAUTY,CREATION,HOPE"),
("인간은 왜 노래하는가?","고독 VS 연결","PLAY,COMMUNITY,MEMORY"),
("인간은 왜 춤추는가?","억압 VS 자유","PLAY,FREEDOM,COMMUNITY"),
("인간은 왜 창조하는가?","현실 VS 이상","CREATION,HOPE,TRANSCENDENCE"),
("인간은 왜 초월을 꿈꾸는가?","한계 VS 무한","TRANSCENDENCE,FAITH,CURIOSITY"),
("인간은 왜 용기를 내는가?","공포 VS 행동","COURAGE,HOPE,RESPONSIBILITY"),
("인간은 왜 자유를 원하는가?","억압 VS 자유","FREEDOM,COURAGE,HOPE"),
("인간은 왜 죽음을 두려워하는가?","삶 VS 죽음","DEATH,FEAR,TRANSCENDENCE"),
]

def make_event(n):
    idx = (n-1) % len(SEEDS)
    question, conflict, souls = SEEDS[idx]

    if n <= 80:
        cluster = "환국"
    elif n <= 220:
        cluster = "배달국"
    elif n <= 280:
        cluster = "환웅"
    elif n <= 330:
        cluster = "웅녀"
    elif n <= 420:
        cluster = "단군"
    elif n <= 470:
        cluster = "홍익인간"
    else:
        cluster = "재세이화"

    eid = f"HWD-{n:04d}"

    text = f"""# {eid}

==================================
SOURCE
==================================

환단고기

==================================
CLUSTER
==================================

{cluster}

==================================
HUMAN QUESTION
==================================

{question}

==================================
CONFLICT
==================================

{conflict}

==================================
HUMAN SOUL
==================================

{souls}

==================================
MODERN CASE
==================================

- 가족
- 농민
- 마을
- 국가
- AI

==================================
CONTENT USE
==================================

- 웅쌤
- 웅녀
- 공동농사국
- 옥암리 사람들
- 참교육

==================================
STORY SEED
==================================

이 사건은 인간 존재의 원형적 질문을 담고 있다.

==================================
STATUS
==================================

MINED
"""

    (BASE / f"{eid}.md").write_text(text, encoding="utf-8")

for i in range(1,501):
    make_event(i)
    if i % 50 == 0:
        print(f"MINED {i}/500")

print("")
print("================================")
print("K-HOS STORY SEED DATABASE COMPLETE")
print("HWD-0001 ~ HWD-0500")
print("================================")
