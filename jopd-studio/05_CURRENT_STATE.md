# 조PD AI 방송국 CURRENT STATE

최종 업데이트: 2026-09-19

## 1. 프로젝트 위치

조PD AI 방송국은 별도 프로젝트가 아니다.

K-AGRI EXPO 본체:

/Users/sehwancho/projects/k-agri-expo

안에서 개발한다.

주요 위치:

- 화면: src/app/studio
- API: src/app/api/studio
- 엔진: src/lib/jopd-studio
- 기준 문서: jopd-studio

---

## 2. 프로젝트 정체성

조PD AI 방송국은 단순 영상 생성기나 일반 영상 편집기가 아니다.

조PD가 방송 현장에서 축적한

기획
→ 취재
→ 촬영
→ 구성
→ 편집 판단
→ 보충자료 판단
→ 완성

의 사고방식을 시스템화하는 AI 방송 제작 운영체제다.

K-AGRI 전체에서는 CONTENT & MEDIA ENGINE 역할을 담당한다.

---

## 3. 절대 원칙 — SOURCE TRUTH MODE

실제 원본에 없는 장면, 사람, 숫자, 발언을
실제 촬영된 것처럼 편집하지 않는다.

반드시 구분한다.

- 실제 촬영 SOURCE
- 실제 음성/전사 후보
- 전문가 자료
- 공식 자료
- 현장 사례
- 기존 한국농수산TV 자료
- 외부 조사 자료
- 기업/제품 주장
- AI 추론
- 조PD 편집 의도
- AI 생성 보충영상/그래픽/내레이션

기획 아이디어와 실제 원본은 절대로 동일시하지 않는다.

ASR 전사는 증거 후보이지 사실 그 자체가 아니다.

원본 타임코드와 방송 타임라인 타임코드는 별도로 관리한다.

---

## 4. 현재 구현 확인

### 화면

- src/app/studio/page.tsx
- src/app/studio/editor/page.tsx
- src/app/studio/rough-cut/page.tsx

### 핵심 엔진

- src/lib/jopd-studio/media-engine.ts
- src/lib/jopd-studio/pd-engine.ts
- src/lib/jopd-studio/transcript-normalizer.ts

### 주요 API

- analyze
- media
- audio-truth
- source-master
- story
- subtitles
- vision
- video-brain
- video-brain-detail
- video-brain-full-scan
- video-brain-understand
- first-cut-plan

기존 백업 파일은 삭제하지 않는다.

---

## 5. VIDEO BRAIN 현재 상태

### VIDEO BRAIN 2.0 — 완료

FULL DECODE 기반 전체 영상 시간축 스캔.

테스트에서 원본 전체 duration coverage 확인.

고정 샘플링만으로 영상을 이해했다고 선언하지 않는다.

### VIDEO BRAIN 2.1 — 완료

BASE VISUAL COVERAGE 구축.

10초 단위 baseline 구간과 복수 프레임을 이용해
전체 시간축 시각 커버리지를 확보했다.

중요:

FULL DECODE와 VISUAL COVERAGE는
FULL UNDERSTANDING과 다르다.

### VIDEO BRAIN 2.2 — 다음 개발 대상

ADAPTIVE EVENT DETECTOR.

단순 고정 프레임 추출 방식으로 만들지 않는다.

기본 방향:

10초 baseline
→ 변화/불확실성/음성 이벤트 감지
→ 필요한 구간 2초 단위 재검사
→ 중요하거나 불확실한 구간 0.5~1초 또는 더 조밀한 검사

감지 대상:

- 컷 변화
- 움직임 변화
- 인물 등장/퇴장
- 표정 변화
- 사물 변화
- 작업 행동 변화
- 발화 시작/종료
- 질문/답변
- 침묵
- 현장음 변화

전체 영상에 임의의 글로벌 frame cap을 두지 않는다.

대용량 원본은 proxy/index/checkpoint/resume 구조로 처리한다.

---

## 6. VIDEO BRAIN 이후 확정 로드맵

2.2 ADAPTIVE EVENT DETECTOR
→ 2.3 MULTIMODAL UNDERSTANDING
→ 2.4 TEMPORAL CONTEXT
→ 2.5 WHOLE SHOOT MEMORY
→ PD ENGINE 고도화
→ 실제 ROUGH CUT
→ EDIT ENGINE
→ 조PD 수정 학습

---

## 7. 영상 이해 계층

영상 이해와 편집 판단을 섞지 않는다.

1. SOURCE SCANNER
2. EVENT DETECTOR
3. SOURCE UNDERSTANDING
4. CONTEXT ENGINE
5. PD INTENT ENGINE
6. EDITORIAL ENGINE
7. EDIT ENGINE

SOURCE UNDERSTANDING에서 최소한 다음을 분리한다.

- WHAT: 화면에서 실제 보이는 것
- WHAT HAPPENED: 행동과 사건 진행
- WHAT WAS SAID: 실제 음성/전사 후보
- WHY SHOT: 왜 촬영했는지에 대한 근거 있는 추론
- STORY VALUE
- EDIT VALUE
- PD INTENT

WHY SHOT은 단일 클립만 보고 판단하지 않는다.
앞뒤 촬영 클립과 전체 취재 맥락을 함께 본다.

---

## 8. 무대사 영상 원칙

말이 없는 영상도 버리지 않는다.

가능한 기능:

- ESTABLISHING
- LOCATION_REVEAL
- CUTAWAY
- INSERT
- REACTION
- PROCESS
- DETAIL
- EVIDENCE
- BEFORE
- AFTER
- TRANSITION
- BRIDGE
- BREATH
- EMOTIONAL_HOLD
- ATMOSPHERE
- NARRATION_BED
- TIME_PASSAGE
- MOVEMENT
- FORESHADOW
- PAYOFF
- CONTINUITY_FIX
- JUMP_CUT_COVER
- ENDING
- UNRESOLVED

한 소스가 여러 기능을 동시에 가질 수 있다.

---

## 9. 일반 농업 방송 기본 모델

백령도 프로젝트만 기준으로 시스템을 설계하지 않는다.

일반적인 한국농수산TV 촬영은:

한 농가
+ 하나의 핵심 주제
+ 농민/농장
+ 작물
+ 제품 또는 농법
+ 인터뷰
+ 작업 과정
+ 작물 상태
+ 증거 장면
+ 인서트
+ 농민에게 필요한 정보

를 하나의 완성된 방송으로 만드는 구조다.

백령도 같은 복합 취재는 COMPLEX_STORY.

일반 농가 촬영은 STANDARD_FARM_STORY.

---

## 10. 사전 작가실 — PRE-PRODUCTION BRAIN

자동 방송국은 영상 업로드 후부터 시작하지 않는다.

촬영 전에 시작한다.

촬영 예정 정보
→ K-AGRI 내부 지식
→ 전문가 자료
→ 농사캘린더
→ 과거 한국농수산TV
→ 관련 YouTube
→ 기업/제품 자료
→ 농민 질문
→ PhotoDoctor 현장 문제
→ 필요시 최신 외부 조사
→ 조PD 촬영 작전서

촬영 작전서는 최소한 다음을 포함한다.

- 촬영지
- 농가
- 인물
- 작물
- 제품/농법
- 한 줄 주제
- 농민 시청자 가치
- 취재 가설
- 검증할 사실
- 인터뷰 질문
- 숫자
- 실패/약점
- 경제성
- 반드시 찍을 장면
- 무대사 인서트
- 제품 주장과 검증 방법
- 기존 방송과 다른 NEW POINT
- 예상 OPEN/문제/발견/검증/결과/정보/END
- 쇼츠 후보
- 제목/썸네일 후보와 필요한 화면

---

## 11. 촬영 후 PLAN vs ACTUAL

촬영 후 반드시 비교한다.

- 계획대로 확보 ✓
- 예상보다 좋은 장면 발견 ★
- 못 찍음 !
- 현장 주장이 사전 정보와 다름 !
- 새로운 사실 발견 ★
- 추가 확인 필요 ?

사전 기획을 실제 촬영보다 우선하지 않는다.

실제 원본이 최종 SOURCE TRUTH다.

---

## 12. JOPD EDITING DNA

기존 작가실 DNA와 별개다.

조PD의 실제 편집 판단을 학습하는 전용 시스템이 필요하다.

학습원:

1. 기존 한국농수산TV 완성 영상
2. 가능하면 과거 RAW ↔ FINAL 비교
3. 앞으로 AI 편집 ↔ 조PD 수정 비교

학습 대상:

- 오프닝
- 훅
- 컷 길이
- 인터뷰 압축
- 질문 사용 여부
- 인터뷰 재배치
- 무대사 장면
- 인서트
- 리액션
- 여운
- 현장음
- BGM
- 자막
- 내레이션
- 클라이맥스
- 엔딩

조PD 수정:

살려
잘라
2초 더
인터뷰 앞으로
질문 빼
음악 빼

등을 EDIT DECISION MEMORY로 축적한다.

장르별 DNA를 분리한다.

- 농민 성공사례
- 현장취재
- 농법 설명
- 제품 검증
- 인터뷰
- 다큐멘터리
- 뉴스형
- 기업 홍보
- Shorts

---

## 13. K-AGRI 전체 생태계에서의 위치

K-AGRI의 최상위 축:

농민 × 기업 × 바이어 × 전문가/지식 × K-AGRI

조PD AI 방송국은 이 생태계의 CONTENT & MEDIA ENGINE이다.

전체 순환:

전문자료/공식자료/현장자료/방송자료
→ K-AGRI BRAIN
→ 사전 작가실
→ 촬영
→ VIDEO BRAIN
→ PD ENGINE
→ EDIT ENGINE
→ 한국농수산TV
→ K-AGRI EXPO
→ PhotoDoctor / 기업 / 농민 / Buyer
→ K-AGRI 365 / B2B / GLOBAL
→ 주문 / 거래 / 정산
→ 실제 결과
→ CRM / DATA
→ K-AGRI BRAIN

---

## 14. K-AGRI EXPO 역할

EXPO는 단순 쇼핑몰이 아니다.

기업이 참가하고
농민과 국내·해외 바이어가 참여해

한국 농업의

- 제품
- 기술
- 농법
- 농산물
- 현장 성과

를 발견하고 검증하고 상담하고 거래를 시작하는
농업 산업 광장이다.

---

## 15. K-AGRI 365 역할

EXPO와 역할을 구분한다.

K-AGRI EXPO:
발견 / 만남 / 검증 / 상담 / 비즈니스 시작.

K-AGRI 365:
EXPO에서 만들어진 관계와 거래를
365일 지속시키는 거래시장.

상품부터 보여주는 일반 쇼핑몰이 아니라
농민 문제 해결과 연결되는 commerce를 지향한다.

---

## 16. PhotoDoctor 역할

PhotoDoctor는 단순 사진 판독 기능이 아니다.

농민의 실제 문제를 K-AGRI BRAIN으로 유입시키는 현장 센서다.

흐름:

사진
→ 작물
→ 증상
→ 진단 후보
→ 관련 지식
→ 행동지시
→ 상담
→ 필요한 경우에만 관련 제품
→ 결과

진단과 제품 판매를 동일시하지 않는다.

---

## 17. GLOBAL / BUYER

GLOBAL은 나중에 별도 시스템으로 덧붙이지 않는다.

현재부터 데이터 구조와 연결 규칙에서 고려한다.

향후:

Buyer Demand
→ K-AGRI Matching
→ 기업/농가
→ 검증자료
→ 견적
→ 협상
→ 거래
→ 수출 결과

까지 연결한다.

---

## 18. 실제 K-AGRI 데이터 실사 결과

2026-09-19 기준 운영 Supabase를 실사했다.

확인:

- REST 노출 테이블 약 235개
- knowledge_page_index 약 19,536
- knowledge_assets_unified 946
- farm_calendar_actions 593
- ai_content_materials 593
- knowledge_file_jobs 138
- writers_room_recommendations 120
- PhotoDoctor 데이터 존재
- EXPO 기업/상품/주문/Lead 데이터 존재
- 농민 데이터 존재
- Buyer/Global 골격 존재
- CRM 로그 대량 존재

59개 테이블에서 REST OpenAPI 관계 메타데이터를 확인했다.

실제 FK 중심축 예:

vendors
→ booths
→ products

profiles
→ farmers

expo_consult_leads
→ expo_lead_assignments
→ vendors
→ expo_conversions

기존 DB는 빈 껍데기가 아니다.

새 시스템을 무조건 새로 만들지 않는다.

---

## 19. 중복 세대 처리 원칙

현재 여러 세대의 테이블이 공존한다.

예:

농민:
farmers / farmer_profiles / expo_farmers / live_farmers / customers

상품:
products / booth_products / expo_products / expo_brand_products / farmer_products

주문:
expo_orders / expo_brand_orders / photodoctor_orders / farmer_orders / deal_orders

기업:
vendors / booths / expo_brands

즉시 삭제하거나 강제 통합하지 않는다.

원칙:

MASTER
↕
IDENTITY / ADAPTER / LINK
↕
기존 시스템

방식으로 점진적으로 연결한다.

---

## 20. 다음 작업 전 게이트

VIDEO BRAIN 2.2 코딩 전에 다음을 먼저 확정한다.

1. K-AGRI MASTER ARCHITECTURE 1.0
2. DATA MAP 1.0
3. Canonical ID 규칙
4. Adapter 규칙
5. Provenance 규칙
6. Content ↔ Farmer ↔ Problem ↔ Knowledge ↔ Vendor ↔ Product ↔ Buyer ↔ Order ↔ Outcome 연결 원칙

기존 235개 테이블을 무작정 늘리거나 삭제하지 않는다.

이 게이트가 확정된 후

VIDEO BRAIN 2.2 ADAPTIVE EVENT DETECTOR

개발을 재개한다.

---

## 현재 다음 작업

K-AGRI MASTER ARCHITECTURE 1.0과 DATA MAP 1.0을
현재 실제 코드와 운영 DB 기준으로 고정한다.

그 후 VIDEO BRAIN 2.2 개발로 복귀한다.
