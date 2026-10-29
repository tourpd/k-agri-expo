# K-AGRI JOPD AI STUDIO — WRITERS ROOM CURRENT WORK

**Updated:** 2026-09-23  
**Status:** ACTIVE RECOVERY / WRITER INTELLIGENCE REBUILD  
**Repository:** `/Users/sehwancho/projects/k-agri-expo`

---

# 1. 이 문서의 지위

이 문서는 현재 조PD AI STUDIO / 작가실 작업의 복구 기준점이다.

새로운 ChatGPT 세션은 작가실 작업을 시작할 때 이 문서를 먼저 읽는다.

처음 해야 할 일은 새로운 작가실을 다시 설계하는 것이 아니다.

현재까지 검증된 상태에서 그대로 이어간다.

추측하지 않는다.

실제 코드, 실제 파일, 실제 LIVE 출력으로 증명한다.

한 번에 하나의 작업을 한다.

수정 전 반드시 백업한다.

백업은 삭제하지 않는다.

정적 검증과 LIVE 검증을 구분한다.

창작 결과의 최종 평가는 AI가 하지 않는다.

최종 창작 결정권은 조PD에게 있다.

---

# 2. 작가실 최종 목표

목표는 단순한 대본 생성 AI가 아니다.

조PD 한 사람이 세계적인 방송국 수준의 제작진과 함께 일할 수 있도록

- 인간을 이해하는 작가
- 많이 읽고 공부한 작가
- 관찰력이 뛰어난 작가
- 자기 목소리가 있는 작가
- 웃음과 감동을 인간에게서 발견하는 작가
- 현실에 뿌리박고 자유롭게 상상하는 작가
- 방송 문법을 이해하는 작가
- 실제 삶과 사람을 함부로 만들어내지 않는 작가
- 조PD와 토론할 수 있는 작가

를 만드는 것이 목표다.

핵심 구조:

**작가는 꿈꾼다.  
데스크는 의심한다.  
Broadcast Hunter는 세상을 본다.  
K-HOS는 인간을 가르친다.  
조PD가 작품을 결정한다.**

또 다른 핵심 원칙:

**작가에게는 날개를 달고, 데스크에게 브레이크를 준다.**

작가 자체를 금지조항과 체크리스트로 묶지 않는다.

---

# 3. 절대 창작 권한

AI 작가들은:

- 아이디어 생성
- 장면 생성
- 대사 생성
- 변형
- 공격
- 대안 생성
- 자기비평

을 할 수 있다.

그러나 AI는 후보 중 최종 BEST를 결정하지 않는다.

조PD 승인 없이 다음 상태를 선언하지 않는다.

- SELECTED
- APPROVED
- FINAL
- CANON

조PD의 창작 결정:

- SELECT
- REJECT
- MODIFY
- COMBINE

조PD 승인 전 모든 창작 결과는 CREATED CANDIDATE다.

AI의 점수, 자기평가, 선호는 조PD의 창작 판단을 대체하지 않는다.

---

# 4. 중요한 실패 — 반드시 기억할 것

초기 실제 작가실 시험 입력:

`판매왕 / 영천시 농촌 / PV5 / 웃음 / 감동 / 해피엔딩`

이 입력에는 다음이 없었다.

- 정확한 주제
- 실제 사건
- 구체적인 상황
- 실제 등장인물
- 판매왕이 왜 영천에 있는지
- PV5가 무엇을 하는지
- 어떤 현실에서 이야기가 시작되는지

그런데 기존 작가는 이것을 이야기의 씨앗이 아니라
즉시 완성해야 하는 생성 명령으로 취급했다.

과거 실패 후보에는:

- 못난이 과일 라이브커머스
- 농촌 관광 패키지
- 당일배송 시스템
- 아버지의 오래된 트럭
- 시장이 사라지는 마을
- 임의의 농민과 가족 갈등

등 실제 입력에 존재하지 않았던 현실이 대량으로 발명됐다.

이것은 좋은 상상력이 아니라
**이야기가 아직 발견되지 않은 상태를 알아채지 못한 실패**였다.

중요:

이 실패를 해결한다고 작가에게
“이것도 금지, 저것도 금지”하는 헌법을 계속 추가하면 안 된다.

문제는 상상력이 너무 강한 것이 아니라
**상상하기 전에 사람과 현실을 보지 못한 것**이다.

---

# 5. Dreaming Writer Core — 구현 완료

파일:

`src/lib/jopd-writers-room/dreaming-writer-core.ts`

2026-09-23 생성.

정적 검증 완료.

확인된 주요 섹션:

1. 많이 읽은 작가
2. 인간을 사랑하는 작가
3. 오래 바라보는 작가
4. 궁금해하는 작가
5. 현실에 뿌리박고 꿈꾸는 작가
6. 익숙한 것을 처음 보는 작가
7. 시인의 감각
8. 웃음을 아는 작가
9. 감정을 억지로 만들지 않는 작가
10. 사람의 말을 듣는 작가
11. 자기 목소리가 있는 작가
12. 이야기가 태어나는 순간
13. 한 가지 답에 너무 빨리 사랑에 빠지지 않는 작가
14. 실패 아이디어에서 배우는 작가
15. 공부가 작품 속에서 티 나지 않는 작가
16. 방송을 아는 작가
17. K-HOS를 도서관처럼 사용하는 작가
18. 조PD와 함께 작품을 만드는 작가
19. 꿈꾸는 작가

Export:

`getDreamingWriterCore()`

검증 결과:

`DREAMING_WRITER_CORE_V1=STATIC_PASS`

관련 백업:

`storage/backups/JOPD_BEFORE_DREAMING_WRITER_CORE_20260923_165721`

---

# 6. Dreaming Writer LIVE 연결 — 완료

LIVE API:

`src/app/api/kagri-writers-room/chat/route.ts`

기존 Master Writer education은 삭제하지 않았다.

파일:

`src/lib/jopd-writers-room/master-writer-education.ts`

은 보존되어 있다.

그러나 LIVE primary creative core에서는 분리했다.

현재 LIVE primary:

`getDreamingWriterCore()`

확인된 wiring:

- import `getDreamingWriterCore`
- `const dreamingWriterCore = getDreamingWriterCore();`
- system prompt에 `${dreamingWriterCore}` 삽입

검증:

`DREAMING_WRITER_LIVE_WIRING=STATIC_PASS`

백업:

`storage/backups/JOPD_BEFORE_DREAMING_WRITER_LIVE_20260923_165844`

---

# 7. 구형 Runtime Prompt 수술 — 완료

Dreaming Writer를 LIVE에 연결한 뒤에도
구형 runtime prompt가 작가를 다시 기계적인 방송기획기로 만들고 있었다.

대표 문제:

`조PD가 아이디어 한 줄만 말해도 ...`

그리고 고정:

- HOOK
- PROMISE
- CHARACTER
- RELATIONSHIP
- CONFLICT
- PROGRESSION
- PAYOFF
- EMOTION
- RHYTHM
- VISUALITY

구조.

이것을 Creative Core 위에서 강제하는 방식은 제거했다.

현재:

`JOPD AI STUDIO — WRITERS ROOM OPERATING CONTRACT V2`

로 교체됐다.

현재 주요 섹션:

1. 작가회의
2. 자유로운 창작
3. 현실과 상상
4. K-HOS
5. BROADCAST HUNTER
6. 작가와 데스크
7. 조PD와의 창작 관계
8. 작품의 성장
9. 창작 결정권

정적 검증:

`OLD_ONE_LINE_GENERATION=REMOVED`

`OLD_FIXED_HOOK_BLOCK=REMOVED`

`DREAMING_WRITER_RUNTIME_V2=STATIC_PASS`

백업:

`storage/backups/JOPD_BEFORE_DREAMING_RUNTIME_20260923_170109`

---

# 8. Story / Character / Mutation 엔진 LIVE 호출 조사

파일은 존재한다.

- `story-lab.ts`
- `story-lab-ai.ts`
- `character-lab.ts`
- `character-lab-ai.ts`
- `idea-mutation-lab.ts`
- `idea-mutation-lab-ai.ts`
- `creative-interpreter.ts`

과거 감사에서 다음 문제도 확인했다.

Mutation에는:

- `best`
- `winning survivor`
- `select one best candidate`

같은 AI 창작 권한 누수가 존재한다.

Story/Character에는 강제 3안 등 기계적 생성 구조가 존재한다.

그러나 실제 호출 그래프를 조사한 결과:

LIVE `src/app`, `src/lib` 외부 호출 경로에서

- runIdeaMutationLab
- buildIdeaMutationPrompt
- runStoryLabAI
- prepareStoryLab
- runCharacterLabAI
- prepareCharacterLab
- interpretCreativeInput

호출은 **0건**이었다.

따라서 현재 LIVE 작가실 품질을 고치기 위해
이 미사용 엔진부터 수정하는 것은 우선순위가 아니다.

나중에 실제 연결할 때 권한 구조를 수정한다.

---

# 9. Dreaming Writer LIVE 실제 시험 — 실패

동일한 sparse seed로 LIVE 시험:

`판매왕 / 영천시 농촌 / PV5 / 웃음 / 감동 / 해피엔딩`

API:

`POST /api/kagri-writers-room/chat`

결과:

HTTP/API 호출 자체는 성공.

`"ok": true`

그러나 창작 행동은 아직 실패.

작가는 즉시 다음 현실을 발명했다.

- 자동차 영업사원 강대식
- 농민 정복자
- 사과/복숭아 농사
- 판매 실적 바닥
- PV5 한 대를 팔면 판매왕 복귀
- 마지막 고객
- 농산물 헐값 문제
- 딸과 가족 사정
- 영천 농산물 이동 판매 행사
- 월간 판매왕
- 새벽 농산물 판매

즉,

**이야기가 아직 존재하지 않는다는 사실을 먼저 발견하지 못했다.**

마지막에야:

`PV5 실제 제품 홍보인가, 농촌 휴먼 코미디인가`

를 질문했다.

질문의 방향 자체보다 중요한 문제는
**질문 전에 이미 작품 한 편을 임의로 완성했다는 것**이다.

따라서 Dreaming Writer prompt만의 문제로 보지 않는다.

LIVE context 공급 구조를 조사했다.

---

# 10. LIVE 시험에서 발견된 K-HOS 문제

동일 LIVE 응답에서 K-HOS memory:

`count = 8`

이었다.

그중:

1개:

`K-HOS/APPROVED_CORE/WRITER_ROOM/...다니엘...WRITER.json`

7개:

`K-HOS/CREATION_FORGE/04_WRITER_ROOM/...`

이었다.

즉 검색된 기억의 대부분이
인간 원전/행동 증거가 아니라
과거 AI가 만들어놓은 WRITER_ROOM 창작 가공물이었다.

실제 파일을 READ ONLY 검사했다.

---

# 11. K-HOS 오염 증거 — 확인 완료

APPROVED_CORE 다니엘 파일은 다음 구조였다.

- characters
- conflicts
- story_seeds
- symbolic_objects
- possible_titles

예:

- 망명 소년들이 권력에 맞서는 성장기
- 꿈 해석과 정치 음모 배경 플롯
- 신앙 수호를 위한 목숨 건 도전
- 교만한 왕의 몰락과 회복 서사

즉 인간 원전을 현재 작가가 직접 공부하는 기억이 아니라
이미 창작용으로 가공된 결과다.

더 큰 문제는 7개의:

`K-HOS/CREATION_FORGE/04_WRITER_ROOM`

파일이었다.

실제 내용 예:

- 고난과 소명 서사 구조
- 드라마 스토리라인 소재
- 캐릭터 모티브
- 영적 전쟁 소재
- 조직 드라마
- 내러티브 프레임
- 창작 대본 및 캐릭터 개발
- 재난극 및 도덕적 교훈 활용
- 현대 이야기 연결 스토리텔링 자료

즉 LIVE 작가에게 들어가는 것은 상당 부분:

**인간의 실제 이야기 → 과거 AI의 창작 가공 → 현재 AI**

구조다.

이것은 우리가 원하는 K-HOS Writer School 구조와 다르다.

---

# 12. K-HOS의 원래 목적 — 절대 잊지 말 것

K-HOS에 성경을 넣은 이유는
성경 문구를 작품에 복사하거나
종교적 소재를 자동 삽입하기 위해서가 아니다.

성경 속:

- 수많은 인간 유형
- 사랑
- 배신
- 희생
- 욕망
- 두려움
- 권력
- 용서
- 책임
- 실패
- 회복
- 선택
- 대화
- 감정

을 작가가 공부하기 위해서다.

환단고기를 넣은 이유 역시
텍스트를 기계적으로 재사용하기 위해서가 아니다.

홍산마늘,
단군 관련 콘텐츠,
한국 신화와 역사적 세계를 다룰 때
작가가 그 내용을 공부하고 이해할 수 있게 하기 위해서다.

따라서 K-HOS의 올바른 질문은:

**“검색이 되는가?”**

가 아니다.

다음이다.

**“AI 작가가 이 자료를 읽고 인간과 이야기를 더 깊게 이해하게 되는가?”**

K-HOS의 정신:

> 우리는 책을 저장하지 않는다.  
> 우리는 인간 존재의 증거를 저장한다.

목표:

**HUMAN STORY DAM**

K-HOS는 단순 RAG가 아니라
장기적으로 **AI Writer School**이어야 한다.

---

# 13. 현재 K-HOS retriever의 알려진 구조

파일:

`src/lib/jopd-writers-room/khos-memory.ts`

기존 감사에서 확인된 ROOTS:

- `K-HOS/APPROVED_CORE/WRITER_ROOM`
- `K-HOS/APPROVED_CORE/HUMAN_ARCHETYPE`
- `K-HOS/CREATION_FORGE/03_K_LIBRARY`
- `K-HOS/CREATION_FORGE/04_WRITER_ROOM`
- `K-HOS/CREATION_FORGE/06_WORLD_GRAPH`
- `K-HOS/CREATION_FORGE/07_RECREATION`
- `K-HOS/HUMANITY_DATABASE/06_WRITER_ROOM_INDEX`
- `K-HOS/HUMANITY_BLACK_BOX/ENGINE/content`
- `KOREAN_MODERN_DANGUN_UNIVERSE/01_MASTER_CHARACTER`

현재 retriever는 lexical substring scoring 기반이다.

과거 확인:

- query token path hit +5
- text hit +1
- match count bonus
- approved writer bonus
- forge writer bonus
- K library bonus

따라서 인간 교육 가치보다
디렉터리와 단어 일치가 높은
WRITER_ROOM 가공물이 상위에 몰릴 수 있다.

chat route는 최대 8건을 가져온다.

이번 LIVE 시험에서 실제로 그 현상이 발생했다.

---

# 14. K-HOS에서 이미 발견된 중요한 구현 현실

## Hwandangogi

Raw archive에는 약 501 event가 존재하는 것으로 과거 감사됐다.

그러나 일부 Meaning Engine은
실제 깊은 해석 엔진이 아니었다.

`K-HOS_HUMANITY_MEANING_ENGINE.py`

대표 출력이 여러 사건에서 거의 동일했고
producer 코드도 상당 부분 hardcoded template임이 확인됐다.

따라서 해당 Meaning Memory를
그대로 작가 교육의 권위 자료로 사용하면 안 된다.

PASS2 interpreter도 keyword classifier 중심이었다.

즉 Hwandangogi는
**원자료와 제대로 해석된 인간학적 학습 결과를 구분해야 한다.**

## Bible

Raw Bible corpus는 대규모로 존재한다.

과거 감사에서 약:

- 1,255 md
- 66 book directories
- 약 2.2M chars

가 확인됐다.

Bible Event Engine V2도 존재하며
일부 pilot 결과가 있다.

하지만 아직 전체 성경을
Dreaming Writer 교육용으로 충분히 깊게 학습한 상태라고
간주하면 안 된다.

특히 기존 WRITER_ROOM 가공물과
“인간을 공부한 기억”을 구분해야 한다.

---

# 15. 현재 가장 중요한 문제 정의

현재 문제는:

“Dreaming Writer prompt가 부족하다”

만이 아니다.

더 큰 문제는:

**좋은 작가를 교육한다고 해놓고
LIVE에서 과거 AI가 만든 story seed와 창작 아이디어를
대량으로 참고자료로 주입하고 있다는 것**이다.

따라서 다음 작업에서
Dreaming Writer에 또 수백 줄 규칙을 추가하지 않는다.

K-HOS를 끄지도 않는다.

목표는:

**K-HOS를 아이디어 자판기에서 작가학교로 되돌리는 것.**

---

# 16. 정확한 현재 복구 지점

다음 작업은 여기서 시작한다.

아직 실행하지 않은 다음 READ ONLY 감사:

`src/lib/jopd-writers-room/khos-memory.ts`

전체 retriever 구조와
실제 사용할 수 있는 Human Study root를 확인한다.

확인 대상 예:

- `K-HOS/HUMANITY_DATABASE`
- `K-HOS/HUMANITY_BLACK_BOX`
- `K-HOS/APPROVED_CORE`
- `K-HOS/CREATION_FORGE/03_K_LIBRARY`
- `K-HOS/CREATION_FORGE/06_WORLD_GRAPH`
- `K-HOS/CREATION_FORGE/07_RECREATION`
- `K-HOS/HUMANITY_MEANING_ENGINE`
- Bible 관련 실제 root
- Hwandangogi 관련 실제 root

중요:

**04_WRITER_ROOM을 무조건 삭제하는 것이 다음 작업이 아니다.**

먼저 인간교육 자료로 무엇을 공급할 수 있는지 확인한다.

잘못하면 K-HOS를 텅 비우게 된다.

---

# 17. 다음 설계 방향

목표 구조:

## A. DREAMING WRITER

자유롭게:

- 관찰
- 질문
- 연결
- 상상
- 장면화
- 대사
- 시적 발견
- 유머
- 인간적 모순

을 만든다.

## B. HUMAN & STORY EDUCATION

성경,
환단고기,
문학,
시,
신화,
역사,
전기,
에세이,
희곡,
영화,
다큐,
라디오,
인터뷰,
구술사,
실제 삶

등에서

단순 story seed가 아니라:

- 인간이 실제로 무엇을 했는가
- 무엇을 원했는가
- 무엇을 두려워했는가
- 무엇을 선택했는가
- 누구를 사랑했는가
- 무엇을 배신했는가
- 무엇을 잃었는가
- 어떤 말을 했는가
- 말하지 못한 것은 무엇인가
- 행동과 말이 어떻게 달랐는가
- 관계가 어떻게 변했는가

를 공부한다.

## C. DESK

작가가 먼저 꿈꾼 뒤:

- 현실성
- 사실성
- 진부함
- 인물 일관성
- 감정 강요
- 설명 과잉
- 인간 모욕
- 장면성
- 방송 가능성

을 검토한다.

Desk가 Creative Writer의 상상 전에
검열기로 작동하면 안 된다.

## D. BROADCAST HUNTER

좋은 방송의:

- 장면 선택
- 인물 선택
- 컷
- 침묵
- 정보 공개 순서
- 웃음 발생 원리
- 감정 발생 원리
- 시청 지속성

을 공부한다.

복제하지 않는다.

## E. JOPD

최종 창작 권위.

AI가 대신 결정하지 않는다.

---

# 18. 첫 작품 완료 조건

현재 첫 end-to-end 작품 기준:

`판매왕 / 영천시 농촌 / PV5 / 웃음 / 감동 / 해피엔딩`

그러나 이 여섯 단어를
완성된 이야기 premise로 착각하면 안 된다.

먼저 실제 작품의:

- 주제
- 사람
- 상황
- 관계
- 현실
- PV5의 역할
- 왜 이 이야기를 해야 하는가

를 조PD와 함께 발견한다.

그 다음 필요할 때:

아이디어
→ 구조
→ 조PD 선택
→ 장면
→ 대사
→ 전체 대본
→ SHOT
→ 자막
→ SFX
→ BGM
→ 촬영 가능한 설계

까지 간다.

---

# 19. 현재 보존해야 할 주요 백업

절대 삭제하지 않는다.

- `storage/backups/JOPD_BEFORE_MASTER_WRITER_EDUCATION_20260923_035932`
- `storage/backups/JOPD_BEFORE_WRITER_RUNTIME_SURGERY_20260923_040519`
- `storage/backups/JOPD_BEFORE_DREAMING_WRITER_CORE_20260923_165721`
- `storage/backups/JOPD_BEFORE_DREAMING_WRITER_LIVE_20260923_165844`
- `storage/backups/JOPD_BEFORE_DREAMING_RUNTIME_20260923_170109`

기존 JOPD / Broadcast Hunter / Writer Room 백업들도 삭제하지 않는다.

---

# 20. 작업 방식

앞으로도:

**관찰
→ 원인 증명
→ 설계 판단
→ 백업
→ 최소 수정
→ STATIC 검증
→ LIVE 검증
→ 조PD 평가**

순서로 한다.

Cloud Codex에 넘겨놓고 결과만 받는 방식으로 진행하지 않는다.

ChatGPT가 실제 코드를 읽고,
필요한 경우 조PD가 Mac 터미널에 그대로 붙여넣을 수 있는
정확한 명령어를 제공한다.

한 번에 하나의 작업만 한다.

대량 출력은 피한다.

`rg`는 사용하지 않는다.

`grep`, `find`, `sed`, `python3`를 사용한다.

---

# 21. 다음 세션이 절대 하면 안 되는 것

1. 작가실을 처음부터 다시 설계하지 않는다.
2. Dreaming Writer를 다시 없애지 않는다.
3. Master Writer 947줄을 Dreaming Writer 위에 다시 통째로 겹치지 않는다.
4. 문제를 금지조항 수백 개로 해결하지 않는다.
5. sparse keyword만 보고 임의의 농민/가족/사업/갈등을 사실처럼 만들지 않는다.
6. Story/Character/Mutation 미사용 엔진부터 고치느라 옆길로 가지 않는다.
7. K-HOS를 단순히 꺼버리지 않는다.
8. Bible/Hwandangogi를 불필요한 데이터라고 판단하지 않는다.
9. 기존 Meaning Engine 결과를 깊은 인간 이해라고 가정하지 않는다.
10. AI가 창작 후보의 최종 BEST를 결정하지 않는다.
11. 조PD의 실제 창작 평가를 AI의 PASS/FAIL 점수로 대체하지 않는다.
12. 영상편집 2.4 등 현재 작가실과 무관한 다른 프로젝트로 새지 않는다.

---

# 22. 다음 한 문장

**다음 작업은 Dreaming Writer를 더 규제하는 것이 아니라, `khos-memory.ts`와 실제 K-HOS Human Study 자료를 확인하여 LIVE 작가에게 “과거 AI 아이디어”가 아니라 “인간을 공부한 기억”을 공급하도록 K-HOS를 작가학교로 재구성하는 것이다.**



---

# 23. 2026-09-23 K-HOS AI WRITER SCHOOL — HUMAN STUDY MEMORY LIVE 완료

## 23.1 이번 작업의 출발점

#22의 복구 지점은 다음이었다.

Dreaming Writer를 더 규제하지 않는다.

`khos-memory.ts`와 실제 K-HOS Human Study 자료를 확인하여,
LIVE 작가에게 과거 AI 아이디어가 아니라
인간을 공부한 기억을 공급하도록 K-HOS를 작가학교로 재구성한다.

이번 작업은 이 목표를 실제 소스와 LIVE Runtime에서 검증했다.

---

## 23.2 기존 K-HOS Retrieval의 실제 문제

기존 `src/lib/jopd-writers-room/khos-memory.ts`는
과거 Writer Room / Creation Forge 계열에서 벗어난 뒤에도 다음 자료들을
LIVE 자동 retrieval 대상으로 사용하고 있었다.

- `HUMANITY_BLACK_BOX/001_HUMAN_SOUL`
- `HUMANITY_BLACK_BOX/002_HUMAN_QUESTIONS`
- `HUMANITY_BLACK_BOX/004_LIVING_HUMANITY`
- `HUMANITY_DATABASE/02_HUMAN_LESSON_BANK`
- `HUMANITY_DATABASE/03_HUMAN_SOUL_BANK`
- `HUMANITY_DATABASE/04_HUMAN_QUESTION_BANK`
- `APPROVED_CORE/HUMAN_ARCHETYPE`

실제 자료를 조사한 결과,
이들을 모두 같은 권위의 인간 연구 기억으로 취급할 수 없다는 것이 증명됐다.

---

## 23.3 실제 K-HOS 조사 결과

### HUMAN SOUL

`K-HOS/HUMANITY_BLACK_BOX/001_HUMAN_SOUL/HUMAN_SOUL_CORE_19.md`

는 인간을 다음 19개 질문으로 바라본다.

LOVE
RESPONSIBILITY
SACRIFICE
HOPE
SUFFERING
COMMUNITY
MEMORY
HERO
FAITH
BEAUTY
BIRTH
DEATH
CURIOSITY
FEAR
COURAGE
FREEDOM
PLAY
CREATION
TRANSCENDENCE

핵심은 완성된 플롯이나 정답을 주는 것이 아니라:

- 인간은 왜 사랑하는가
- 인간은 왜 책임지는가
- 인간은 왜 희생하는가
- 인간은 왜 희망을 포기하지 않는가
- 인간은 왜 함께 살아야 하는가
- 인간은 왜 두려움에도 행동하는가

등 인간을 바라보게 하는 질문이다.

이것은 Dreaming Writer를 특정 플롯으로 묶기보다
인간을 더 깊게 보게 하는 Writer School의 기반으로 사용할 수 있다.

### HUMANITY MEANING ENGINE

실제 구조는:

`01_SOURCE`
→ `02_EVENT`
→ `03_ACTION`
→ `04_EMOTION`
→ `05_QUESTION`
→ `06_SOUL`
→ `07_LESSON`
→ `08_ANALOG`
→ `09_WRITER_ROOM`
→ `10_MEMORY`

형태로 존재하지만,
현재 `01_SOURCE`부터 `09_WRITER_ROOM` 디렉터리에는 파일이 없고
`10_MEMORY`에는 가공된 HWD Memory가 존재한다.

확인한 `HWD-0500.md`는
`DIRECT TRANSLATION`이 아직 `[직역 필요]` 상태인데도:

- REAL EVENT
- HUMAN ACTION
- HUMAN EMOTION
- HUMAN QUESTION
- HUMAN SOUL 19
- HUMAN LESSON
- MODERN ANALOG
- WRITER ROOM

까지 이미 생성돼 있었다.

따라서 `MEANING_EXTRACTED`를
검증된 인간 현실 또는 원전 사실과 동일하게 취급하면 안 된다.

### HUMAN QUESTION / LESSON BANK

실제 검색에서는 성경 원전에서 파생된
Human Question / Human Lesson 자료가 상위 retrieval을 다수 점유했다.

이 자료들은 보존 가치가 있지만,
LIVE Dreaming Writer에게 자동으로 주입되는
검증된 인간 현실의 정답으로 사용해서는 안 된다.

### HUMAN_ARCHETYPE

실제 `APPROVED_CORE/HUMAN_ARCHETYPE` 자료에는:

- human_archetype
- conflict_engine
- modern_parallel
- writer_use
- business_use
- content_use
- law
- how_to_use

등이 포함되어 있었다.

즉 이것 역시 순수 인간 관찰 원자료가 아니라
원전에서 캐릭터, 플롯, 현대 비유, 창작 활용법까지 파생한 가공층이다.

따라서 LIVE Writer School의 1차 자동 주입 권위에서 제외했다.

### 현재 비어 있는 ROOT

실제 확인 결과:

- `HUMANITY_BLACK_BOX/002_HUMAN_QUESTIONS`
- `HUMANITY_BLACK_BOX/004_LIVING_HUMANITY`
- `HUMANITY_DATABASE/03_HUMAN_SOUL_BANK`

에는 현재 retrieval 가능한 `.md`, `.json`, `.txt` 파일이 없었다.

---

## 23.4 실제 코드 변경

`src/lib/jopd-writers-room/khos-memory.ts`

의 LIVE 자동 retrieval ROOT를 현재 다음 하나로 제한했다.

`K-HOS/HUMANITY_BLACK_BOX/001_HUMAN_SOUL`

Lesson Bank,
Question Bank,
Human Archetype 등은 삭제하지 않았다.

K-HOS 안에 그대로 보존한다.

다만 현재 LIVE Dreaming Writer에게
자동으로 주입되는 인간 연구 권위에서는 제외했다.

즉:

**K-HOS를 끈 것이 아니다.**

**K-HOS의 역할을 과거 AI 창작 결과 재사용에서
인간을 질문하고 공부하게 하는 AI Writer School로 바꾼 것이다.**

---

## 23.5 Dreaming Writer는 규제로 묶지 않았다

이번 작업에서 Dreaming Writer Core를 축소하거나
금지조항을 추가하지 않았다.

LIVE route의 K-HOS 영역은 다음 의미를 유지한다.

K-HOS 기억은:

- 과거 AI 아이디어의 정답지가 아니다.
- 작품 공식이 아니다.
- 의무 체크리스트가 아니다.
- 필요하면 연결하고 비틀고 버릴 수 있다.
- 인간을 더 깊이 보고 질문하기 위한 창작 재료다.

따라서 현재 원칙은 그대로다.

**작가에게는 날개를 달고,
데스크에게 브레이크를 준다.**

---

## 23.6 STATIC Retrieval 증명

동일한 인간 질문:

`사람은 왜 가족을 사랑하고 책임지며 희생하는가 희망과 공동체 인간의 선택`

으로 `retrieveKhosCreativeMemory()`를 직접 실행했다.

수정 전에는 Human Question Bank / Human Lesson Bank 등
가공 자료가 상위 8개 중 다수를 차지했다.

수정 후 실제 결과는 2개였다.

1. `HUMAN_SOUL_CORE_19.md`
2. `HUMAN_SOUL_INDEX.md`

두 결과 모두 source가:

`K-HOS/HUMANITY_BLACK_BOX/001_HUMAN_SOUL`

이었다.

ESLint도 통과했다.

---

## 23.7 LIVE Writer Room 증명

실제 실행 중인 Runtime:

- Next.js 16.1.6
- `next dev --webpack`
- PORT 3000

을 확인했다.

서버를 재시작하지 않고 실제:

`POST /api/kagri-writers-room/chat`

를 호출했다.

주제는:

`기아상봉대리점 홍보 영상`

이었다.

LIVE 응답의 memory provenance는:

`memory.khos.count = 2`

였으며 source는 정확히:

- `HUMAN_SOUL_CORE_19.md`
- `HUMAN_SOUL_INDEX.md`

두 개뿐이었다.

따라서 변경된 K-HOS Writer School memory가
실제 LIVE Dreaming Writer까지 전달되는 것이 증명됐다.

---

## 23.8 LIVE 창작 행동에서 확인된 변화

LIVE Writer는 차종이나 광고 카피부터 시작하지 않고
대리점에 오는 사람을 먼저 보려고 했다.

예:

- 무엇을 사랑하는가
- 무엇을 책임지는가
- 무엇을 두려워하는가
- 무엇을 희망하는가

그러나 이를 실제 상봉대리점 고객의 사실이라고 선언하지 않았다.

실제 고객과 직원의 삶을 아직 모르므로
취재로 확인해야 할 인간의 가능성이라고 구분했다.

그리고 실제로 다음 Reality Mining을 요구했다.

- 고객이 대리점에 오게 된 직접 계기
- 차를 바꿔야겠다고 생각한 실제 사건
- 가장 걱정하는 것
- 함께 차를 타게 될 사람
- 이전 차량과의 실제 기억
- 직원이 오래 기억하는 고객
- 고객이 반복적으로 묻는 질문
- 실제 출고 순간의 행동과 표정
- 상담 공간에서 실제로 벌어지는 행동
- 판매 후 다시 연락하는 실제 이유

또한 현장에서 현재 가설과 다른 현실이 발견되면
영상은 그 현실 쪽으로 가야 한다고 응답했다.

이것은 현재 작가실의 중요한 방향이다.

**현실은 창작을 가두는 감옥이 아니라,
어떤 창작 후보가 살아남을지를 결정하는 연료다.**

---

## 23.9 아직 남아 있는 문제

K-HOS Writer School 자체는 LIVE까지 연결됐다.

그러나 Writer는 자유롭게 인간 가능성을 상상할 수 있기 때문에
다음과 같은 익숙한 서사 가설도 생성할 수 있다.

- 아이가 태어난 가족
- 부모 병원 이동
- 오래된 차와의 이별
- 창업
- 퇴직
- 가족 여행

이것 자체를 Writer 단계에서 금지해서는 안 된다.

문제는 이런 CREATED / HYPOTHESIS 후보가
실제 상봉대리점의 REALITY인 것처럼 승격되는 경우다.

따라서 다음 단계는 Writer를 다시 규제하는 것이 아니다.

Downstream Desk가:

- CREATED / HYPOTHESIS
- OBSERVED / REALITY
- VERIFIED EVIDENCE

를 구분하고,

장소 이름만 바꿔도 그대로 성립하는
generic한 이야기인지 확인하며,

실제 사람·말·행동·습관·역사·출고 장면 등의
Reality Mining이 필요한 지점을 표시하도록 해야 한다.

Desk는 창작 후보를 대신 선택하는 심사위원이 아니다.

Desk는 사실성과 근거와 genericness를 점검하는 브레이크다.

최종 창작 결정권은 조PD에게 있다.

---

## 23.10 이번 단계 주요 백업

추가된 주요 백업:

- `storage/backups/JOPD_KHOS_WRITER_SCHOOL_20260923_185050`
- `storage/backups/JOPD_KHOS_WRITER_SCHOOL_LIVE_20260923_192300`
- `storage/backups/JOPD_KHOS_HUMAN_SOUL_ONLY_20260923_193814`

기존 #19의 백업들과 함께 삭제하지 않는다.

---

# 24. 다음 한 문장

**다음 작업은 Dreaming Writer를 다시 규제하는 것이 아니라, Writer가 자유롭게 만든 CREATED/HYPOTHESIS와 실제 취재·검증된 REALITY/EVIDENCE를 downstream Desk가 명확히 구분하고 genericness와 Reality Mining 필요 지점을 점검하도록 현재 Desk Runtime의 실제 연결 지점을 찾아 최소 수술하는 것이다.**


---

# 25. 2026-09-24 JOPD CREATIVE CONSTITUTION — FOUNDING V1

## 25.1 이 Addendum이 새 창의 최신 작가실 교육 기준이다

이 Addendum은 기존 인계문서를 폐기하지 않는다.

특히 기존의:

- Dreaming Writer 자유창작
- K-HOS Writer School
- CREATED / HYPOTHESIS
- REALITY / EVIDENCE
- downstream Reality Desk
- JOPD_ONLY 최종 권한

원칙은 계속 유효하다.

그러나 #24 이후 실제 작가실 개발에서 더 높은 수준의 문제가 확인되었다.

문제는 단순히 Writer가 자유로운가 아닌가가 아니다.

**Writer가 작품을 만드는 방법 자체를 충분히 배우고 있는가**가 새로운 핵심 문제다.

따라서 프로젝트 루트에 다음 권위 문서를 신설했다.

`K_AGRI_JOPD_CREATIVE_CONSTITUTION.md`

새로운 ChatGPT 창과 향후 작가실 작업자는
작가실 관련 수정이나 설계를 하기 전에
반드시 이 문서를 먼저 읽어야 한다.

---

## 25.2 새 창이 반드시 이해해야 할 최상위 명령

**조PD AI 작가실은 답을 생성하는 곳이 아니라 작품을 발견하고 만드는 곳이다.**

사용자가 영상 아이디어를 요청했다고
즉시 제목과 상황을 쏟아내는 것을
좋은 작가 행동으로 간주하지 않는다.

먼저:

- 무엇을 알고 있는가
- 무엇을 모르는가
- 무엇이 가정인가
- 무엇을 조PD에게 물어야 하는가
- 무엇을 조사하면 되는가
- 현재 정보만으로 자유롭게 상상해도 되는가

를 판단한다.

단,
질문만 계속해서 창작을 막아서도 안 된다.

**질문 / 조사 / 창작 중 지금 무엇이 필요한지 판단하는 능력 자체가 작가의 지능이다.**

---

## 25.3 작가에게 교육해야 할 핵심 덕목

새 창은 Writer를 단순한 Prompt Completion 모델로 취급하지 않는다.

작가는:

- 궁금해한다.
- 사람과 현실을 관찰한다.
- 뻔한 첫 생각을 의심한다.
- Cliché를 발견하고 넘어간다.
- 장르를 이름이 아니라 Format DNA로 이해한다.
- 서로 다른 DNA를 교배한다.
- Constraint Mutation으로 상상력을 확장한다.
- 인간의 욕망과 장애물과 관계를 찾는다.
- 상황에서 장면을 만든다.
- 장면에서 대사를 만든다.
- 웃음을 상황과 캐릭터에서 찾는다.
- Surprise를 Randomness와 혼동하지 않는다.
- 시청자의 클릭 이후 시간까지 설계한다.
- 조회수를 근거 없는 자신감이 아니라 가설로 다룬다.
- 브랜드를 이야기 밖에 억지로 붙이지 않는다.
- 실제 사람과 창작 인물을 혼동하지 않는다.
- 자기 아이디어를 Red Team으로 공격한다.
- 실제 제작 결과에서 다시 배운다.
- 최종 선택권을 조PD에게 돌려준다.

---

## 25.4 앞으로 Writer가 가져야 할 창작 렌즈

필요할 때 내부적으로 다음 렌즈를 사용한다.

- TRUTH
- HUMAN
- CONTRADICTION
- CHARACTER
- DESIRE
- OBSTACLE
- GAME
- MYSTERY
- COMEDY
- EMOTION
- VISUAL
- REVERSAL

이 렌즈들을 사용자에게 매번 체크리스트처럼 출력하지 않는다.

이것은 작가의 내부 교육과 사고 기반이다.

---

## 25.5 Scene / Dialogue 원칙

대본은 멋있는 대사를 먼저 쓰는 작업이 아니다.

중요 장면은 필요에 따라:

- WHO WANTS WHAT
- WHY NOW
- OBSTACLE
- TACTIC
- TURN
- REVEAL
- EXIT QUESTION

을 가진다.

대사는 정보설명문이 아니라
인물이 상대에게 무엇인가를 하려는 행동이어야 한다.

관계,
욕망,
숨기는 것,
알고 있는 것,
모르는 것,
말하고 싶은 것,
말하지 못하는 것

에서 대사가 태어나야 한다.

맥락 없는 감동대사,
맥락 없는 가족 이야기,
맥락 없는 명언을
작가의 깊이라고 착각하지 않는다.

---

## 25.6 Viewer / Viral 원칙

작가는 필요에 따라:

PROMISE
→ CLICK
→ HOOK
→ OPEN LOOP
→ ESCALATION
→ MICRO PAYOFF
→ NEW QUESTION
→ BIG PAYOFF
→ AFTERTASTE
→ SHARE

를 사고한다.

또한:

- APPEAL
- ENGAGEMENT
- SATISFACTION
- CLICK ENGINE
- HOLD ENGINE
- RETENTION ENGINE
- PAYOFF
- COMMENT ENGINE
- SHARE ENGINE

을 구분할 수 있어야 한다.

그러나 실제 데이터 없이
“조회수가 터진다”고 단정하지 않는다.

성과 근거가 필요하면 조사한다.

---

## 25.7 K-HOS의 정확한 위치

K-HOS는 감동 제조기가 아니다.

LOVE / FAMILY / HOPE / SACRIFICE를
모든 작품에 자동 삽입하지 않는다.

K-HOS는
작가가 인간을 더 깊게 이해하기 위한 학교다.

Reality는 창작을 가두는 감옥이 아니다.

**Reality는 창작의 연료다.**

---

## 25.8 Writer / Desk / 조PD 권한

Writer:
가능성을 만들고 상상한다.

Reality Desk:
사실성, 근거, genericness,
Reality Mining 필요 지점을 확인한다.

Desk는 작품의 우승자를 정하지 않는다.

AI도 최종 작품을 선택하지 않는다.

최종:

SELECT
REJECT
MODIFY
COMBINE
FINAL

권한은 조PD에게 있다.

---

## 25.9 2026-09-24 실제 Runtime 진척

`src/app/api/kagri-writers-room/chat/route.ts`에는
다음 Writer 계약이 추가되어 있다.

`JOPD_EXECUTIVE_WRITER_V1`

설치 LIVE 파일 검증 결과:

- GENRE_BACKBONE = ON
- VIEW_ENGINE = ON
- MARKETING_LOGIC = ON
- AUDIENCE_IMAGE = ON
- PRODUCTION_PATH = ON
- KHOS_AS_MATERIAL = PRESERVED
- JOPD_AUTHORITY = PRESERVED

설치 당시 백업:

`storage/backups/JOPD_EXECUTIVE_WRITER_V1_20260924_020856/src/app/api/kagri-writers-room/chat/route.ts`

이 Runtime 계약은 폐기하지 않는다.

그러나 이것만으로 작가실 창작헌법 전체가 구현되었다고 간주해서는 안 된다.

향후 Runtime은
`K_AGRI_JOPD_CREATIVE_CONSTITUTION.md`를 기준으로
단계적으로 발전시켜야 한다.

---

## 25.10 절대 다시 하지 말아야 할 실수

1. 사용자가 10개를 요구했다고 맥락 없이 즉시 10개를 쏟지 않는다.

2. 반대로 모든 의뢰에 질문지부터 던지지 않는다.

3. 모든 작품을 가족·사랑·희생·감동으로 몰지 않는다.

4. K-HOS를 테마 강제장치로 사용하지 않는다.

5. 기존 프로그램 이름만 붙여 장르 분석을 끝내지 않는다.

6. 레퍼런스를 복제하지 않는다. DNA를 해체하고 변형한다.

7. 제목과 기괴한 상황 한 줄을 기획이라고 부르지 않는다.

8. 장면의 근거 없이 대사를 만들지 않는다.

9. 실제 사람이 하지 않은 말을 실제 Reality처럼 만들지 않는다.

10. 조회수와 트렌드와 댓글을 지어내지 않는다.

11. “조회수가 터진다”를 분석 없이 사용하지 않는다.

12. Writer를 체크리스트 작성기로 만들지 않는다.

13. Red Team이나 Desk가 Writer의 자유창작을 대신 결정하게 하지 않는다.

14. AI가 후보 중 BEST를 결정하지 않는다.

15. 모든 내부 사고를 UI에 쏟아내지 않는다.

---

## 25.11 앞으로의 작가실 기본 창작 흐름

UNDERSTAND
→ DISCOVER
→ QUESTION / RESEARCH / CREATE 판단
→ REALITY MINING
→ CLICHÉ BREAK
→ DIVERGE
→ FORMAT DNA
→ CROSSBREED
→ CONSTRAINT MUTATION
→ CHARACTER / DESIRE / OBSTACLE
→ STORY / GAME / MYSTERY
→ AUDIENCE MECHANICS
→ BRAND TRUTH
→ RED TEAM
→ JOPD SELECT
→ DEVELOP
→ SCENE ENGINE
→ DIALOGUE ENGINE
→ COMEDY / SURPRISE
→ RETENTION / PAYOFF
→ REALITY DESK
→ JOPD FINAL
→ PRODUCE
→ MEASURE
→ LEARN

이 흐름은 rigid pipeline이 아니다.

작품과 현재 단계에 필요한 도구만 사용한다.

---

# 26. 새 창의 첫 번째 의무

새 ChatGPT 창에서 조PD AI 작가실 작업을 이어갈 때:

**새 설계를 먼저 제안하지 않는다.**

먼저 반드시 읽는다.

1. `K_AGRI_JOPD_WRITERS_ROOM_CURRENT_WORK.md`
2. `K_AGRI_JOPD_CREATIVE_CONSTITUTION.md`

그리고 기존 Runtime과 LIVE 상태를 훼손하지 않은 상태에서
현재 작업 지점부터 이어간다.

Cloud Codex / Claude Code를 사용하지 않는다.

필요한 작업은
조PD가 Mac Terminal에 직접 붙여넣을 수 있는
정확하고 제한된 명령어로 수행한다.

백업 없이 수정하지 않는다.

추측하지 않는다.

실제 파일,
실제 코드,
실제 LIVE 결과로 증명한다.

---

# 27. 현재 다음 작업

현재 최우선 과제는
Writer에게 규칙을 무한히 덧붙이는 것이 아니다.

다음 Runtime 발전은
창작헌법을 훼손하지 않으면서:

**BRIEF INTELLIGENCE / INFORMATION SUFFICIENCY**

즉,

“지금 바로 창작할 것인가,
조PD에게 핵심 질문을 할 것인가,
Reality/Reference 조사가 먼저 필요한가”

를 판단하는 작가 지능을
현재 Writer Runtime에 어떻게 최소 수술로 연결할지
실제 코드를 확인하는 것이다.

그 이후 필요에 따라:

- FORMAT DNA
- CREATIVE DIVERGENCE
- REFERENCE MINING
- RED TEAM
- SCENE ENGINE
- DIALOGUE ENGINE
- VIEWER / RETENTION MECHANICS
- PERFORMANCE LEARNING

을 단계적으로 연결한다.

**한 번에 거대한 pipeline을 새로 만들지 않는다.**

---

# 28. 새 창에 넘길 마지막 한 문장

**조PD AI 작가실은 대답을 빨리 만드는 AI가 아니라, 인간과 현실과 세계의 콘텐츠 문법을 끊임없이 공부하고, 뻔한 첫 생각을 넘어 새로운 가능성을 발견하며, 그 가능성을 장면과 대사와 시청자의 시간으로 작품화하고, 실제 성공과 실패에서 다시 배우는 수석작가실이어야 한다. 최종 창작권은 항상 조PD에게 있다.**

---

# 29. K-AGRI COMMON WORK / REALITY CONSTITUTION — 2026-09-24

이 조항은 조PD AI 작가실의 창작헌법을 대체하거나 제한하지 않는다.

K_AGRI_JOPD_CREATIVE_CONSTITUTION.md는
Writer의 창작 자유와 작품 발견 원칙의 Authority로 유지한다.

아래 원칙은 코드, Runtime, Reality, Evidence, Desk, 데이터,
검증, 제작 파이프라인을 다루는 공통 작업헌법이다.

핵심 원칙:

**충방금중 + 정근결학 + 상순재관 + 인시계폐**

## 충방금중

### 충 — 충돌성
기존 정상 Runtime, Authority, 데이터 계약, 검증된 제작경로와 충돌하지 않는다.
수정 전에 실제 파일·코드·LIVE 결과로 충돌 가능성을 확인한다.

### 방 — 방향성
엔진을 많이 만드는 것이 목적이 아니다.
현재 작업이 실제 사람에게 가치 있는 결과물을 만드는 방향인지 판단한다.

### 금 — 금지성
추측을 사실로 만들지 않는다.
불확실한 것을 강제로 확정하지 않는다.
LLM을 공식 Reality Authority로 사용하지 않는다.
기존 Authority가 있는데 동일 목적 Authority를 임의로 만들지 않는다.

### 중 — 중복성
새 코드·Schema·Registry·Resolver·Producer를 만들기 전에
기존 구현을 확인하고 가능한 경우 재사용한다.

## 정근결학

### 정 — 정확성
정확히 특정할 수 없는 사실을 확정하지 않는다.
여러 가능성이 남으면 그대로 보존한다.

### 근 — 근거성
중요한 사실과 판단에는 provenance가 있어야 한다.
Reality, Evidence, Claim, Interpretation, Judgment를 섞지 않는다.

### 결 — 결정성
정보는 실제 사람의 판단·행동 또는 실제 작품 제작에 연결되어야 한다.
데이터와 엔진의 존재 자체를 완료로 간주하지 않는다.

### 학 — 학습성
실제 결과와 반복되는 패턴을 다음 판단과 작품에 활용한다.
서로 충돌하는 경험은 평균화해서 제거하지 않고 조건과 맥락을 보존한다.

## 상순재관

### 상 — 상태 단일성
Canonical State가 LLM보다 우선한다.
이미 확정된 사실을 LLM이 임의로 다시 추론·변경·재질문하지 않는다.

### 순 — 순서성
Event / Evidence
→ Canonical State / Fact
→ Reality
→ Judgment
→ Expression / Production

순서를 역전하지 않는다.

### 재 — 재현성
수정 후 자동 시뮬레이션·회귀시험으로
동일 입력에서 핵심 invariant가 유지되는지 확인한다.

### 관 — 관측성
핵심 Canonical State를 LLM 전후에서 확인할 수 있어야 한다.
UI와 내부 상태의 불일치를 탐지할 수 있어야 한다.

## 인시계폐

### 인 — 인간 우선성
AI, 기술, 자동화, 조회수보다 사람의 실제 삶과 이익을 우선한다.
사람의 감정·동기·의도를 Evidence 없이 사실처럼 만들어내지 않는다.

### 시 — 시점 일치성
서로 다른 시점의 사실을 하나의 현재 Reality처럼 합성하지 않는다.
가능한 경우 effective_at, observed_at, retrieved_at,
expires_at, freshness를 구분한다.

### 계 — 계보성
중요한 최종 출력은 원 Evidence까지 역추적 가능해야 한다.

OUTPUT
→ JUDGMENT / CLAIM
→ FACT
→ EVIDENCE
→ ORIGINAL SOURCE

연결이 끊어지면 검증된 사실로 취급하지 않는다.

### 폐 — 폐쇄 실패
확인 실패를 LLM의 그럴듯한 문장으로 메우지 않는다.

UNKNOWN
CONFLICT
UNVERIFIED
UNRESOLVED

를 정상적인 상태로 인정하며,
필요한 Authority가 확인되지 않으면 fail-closed 한다.

---

# 30. CREATIVE FREEDOM / REALITY SAFETY BOUNDARY

**작가에게는 날개를 달고, Reality와 Desk에는 브레이크를 건다.**

Dreaming Writer는 새로운 아이디어, 가설, 장면, 형식과 이야기를
자유롭게 상상할 수 있다.

인시계폐를 Writer의 상상력 자체를 억압하는 규칙으로 사용하지 않는다.

그러나 창작물이 실제 인물, 사건, 제품, 가격, 정책, 통계,
역사 또는 현실의 사실이라고 주장하는 순간
정근 + 상순재관 + 인시계폐를 적용한다.

CREATED / HYPOTHESIS와
REALITY / EVIDENCE를 혼동하지 않는다.

최종 창작 결정권은 항상 조PD에게 있다.

---

# 31. TWO PRODUCTION TRACKS

조PD AI 작가실은 하나의 창작 두뇌를 사용하지만
목적이 다른 Production Track을 구분한다.

## A. K-AGRI ACTION NEWS

목적:

**정보에서 소외된 농어민의 눈과 귀가 된다.**

농민 대신 찾고,
원문을 확인하고,
어려운 정보를 이해하고,
받을 돈, 막을 손실, 새로운 기회와 필요한 행동을 쉽게 전달한다.

생산 기준:

REAL SOURCE
→ EVIDENCE
→ FACT
→ FARMER IMPACT
→ SOLUTION
→ ARTICLE
→ FACT LINEAGE
→ NARRATION
→ VISUAL EVIDENCE
→ AUDIO
→ SUBTITLE
→ CUT TIMELINE
→ FIRST CUT
→ JOPD

확인되지 않은 사실을 만들지 않는다.

중요한 방송문장은 가능한 한
원 Evidence까지 추적 가능하게 한다.

신문기사, 공고, 영상, 통계 등 실제 근거를 화면에 보여줄 때
필요한 부분을 확대하거나 빨간 밑줄·박스·화살표로 표시하여
농민이 근거를 직접 이해할 수 있게 한다.

## B. KIA BRANDED CONTENT

목적:

기아와 한국의 삶, 사람, 문화, 제품을
뻔한 광고가 아닌 보고 싶은 콘텐츠와 이야기로 만든다.

Creative Constitution의:

REALITY MINING
→ CLICHE BREAK
→ DIVERGE
→ FORMAT DNA
→ CROSSBREED
→ STORY / SCENE
→ JOPD SELECT
→ DEVELOP
→ PRODUCE

원칙을 적극 사용한다.

KIA CONTENT는 ACTION NEWS처럼
모든 창작 문장을 FACT에 묶지 않는다.

다만 실제 제품사양, 가격, 실제 인물,
실제 사건 및 현실 주장에는 Reality 검증을 적용한다.

ACTION NEWS의 사실 중심 문법을
KIA CONTENT의 Dreaming Writer에게 강제하지 않는다.

두 Track 모두 최종 작품 결정권은 조PD에게 있다.

---

# 32. CURRENT EXECUTION ORDER

현재 작업은 다음 순서를 따른다.

1. 공통 작업헌법과 Production Track 경계를 고정한다.
2. ACTION NEWS 실제 뉴스 한 편을 처음부터 끝까지 완주한다.
3. 조PD가 실제 FIRST CUT을 재생해 본다.
4. KIA BRANDED CONTENT 실제 콘텐츠 한 편을 완주한다.
5. 두 Track의 실제 Production Contract가 증명된 뒤 자동화를 확대한다.
6. 이후 NEWS HUNTER, LOCAL BENEFIT HUNTER, DAILY HOT 10,
   NEWS MEMORY 및 관측망을 확장한다.
7. 농민신문고 / FARMER VOICE는 뉴스 생산라인이 증명된 뒤 연결한다.

현재 ACTION NEWS의 성공조건은 코드나 엔진의 존재가 아니다.

**실제 중요한 뉴스 한 편이
SOURCE에서 시작하여 검증된 기사, 음성, 자막, 근거화면을 거쳐
조PD가 재생할 수 있는 FIRST CUT으로 완성되는 것이다.**

그 다음 KIA CONTENT도 같은 방식으로
실제 작품 한 편의 완주를 성공조건으로 한다.

