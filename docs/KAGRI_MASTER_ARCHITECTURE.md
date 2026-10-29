# K-AGRI MASTER ARCHITECTURE 1.0

최종 업데이트: 2026-09-19
상태: ARCHITECTURE LOCK CANDIDATE

---

## 1. K-AGRI의 정의

K-AGRI는 단순 온라인 박람회나 쇼핑몰이 아니다.

대한민국 농업의

지식
→ 현장
→ 농민
→ 기업
→ 바이어
→ 콘텐츠
→ 상담
→ 거래
→ 결과

를 하나의 데이터 흐름으로 연결하는
농업 산업 인텔리전스 플랫폼이다.

핵심 목표는

"혼자 고민하는 농사"를
"함께해서 돈 버는 농사"로 바꾸는 것이다.

---

## 2. K-AGRI의 5대 축

K-AGRI 전체 구조는 다음 5개 축을 중심으로 설계한다.

1. 농민
2. 기업
3. 바이어
4. 전문가 / 지식
5. K-AGRI

각 축을 별도 서비스로 고립시키지 않는다.

모든 활동은 공통 데이터와 관계를 통해 연결한다.

---

## 3. 전체 생태계

전문가 자료
공식 농업자료
농사캘린더
현장 사례
PhotoDoctor
한국농수산TV 과거 방송
기업 자료
농민 질문
Buyer Demand
        ↓
   K-AGRI BRAIN
        ↓
┌──────────────────────────────┐
│ PRE-PRODUCTION BRAIN         │
│ 조PD 사전 작가실             │
└──────────────────────────────┘
        ↓
      촬영
        ↓
┌──────────────────────────────┐
│ JOPD AI STUDIO              │
│ VIDEO BRAIN                 │
│ PD ENGINE                   │
│ EDIT ENGINE                 │
└──────────────────────────────┘
        ↓
 한국농수산TV / Shorts / 콘텐츠
        ↓
┌──────────────────────────────┐
│ K-AGRI EXPO                 │
│ 발견 · 검증 · 상담 · 연결    │
└──────────────────────────────┘
        ↓
농민 ─ 기업 ─ Buyer ─ 전문가
        ↓
PhotoDoctor / 상담 / Lead / B2B
        ↓
┌──────────────────────────────┐
│ K-AGRI 365                  │
│ 365일 지속 거래시장          │
└──────────────────────────────┘
        ↓
주문 / 견적 / 거래 / 배송 / 정산 / 수출
        ↓
     실제 결과
        ↓
 CRM / OUTCOME / MARKET DATA
        ↓
   K-AGRI BRAIN
        ↓
다음 취재 / 다음 방송 / 다음 솔루션 / 다음 거래

이 순환을 K-AGRI의 핵심 DATA LOOP로 정의한다.

---

## 4. K-AGRI BRAIN

K-AGRI BRAIN은 전체 생태계의 판단 계층이다.

단순 LLM 채팅 기능을 의미하지 않는다.

다음 데이터를 연결한다.

- 작물
- 품종
- 지역
- 시기
- 생육단계
- 농민 문제
- 병해충
- 영양
- 물관리
- 시설/장비
- 전문가 자료
- 공식 자료
- 농사캘린더
- PhotoDoctor 사례
- 농민 현장 경험
- 기업
- 제품
- 농법
- 과거 방송
- 콘텐츠 반응
- 상담
- 구매
- Buyer 수요
- 거래
- 결과

목표는 자료 저장이 아니라

자료
→ 지식
→ 판단
→ 행동
→ 결과

로 전환하는 것이다.

---

## 5. KNOWLEDGE ENGINE

기존 K-AGRI 지식 자산을 우선 사용한다.

확인된 주요 자산:

- knowledge_file_jobs
- knowledge_page_index
- knowledge_assets_unified
- knowledge_visual_pages
- knowledge_visual_findings
- knowledge_action_instructions
- knowledge_farmer_consulting_answers
- knowledge_broadcast_materials
- knowledge_shorts_materials
- knowledge_rules
- farm_calendar_actions
- ai_content_materials
- writers_room_recommendations

기존 원본 자료:

- 전문가 PDF/PPT/PPTX
- 페이지 이미지
- 텍스트 추출본
- 한국농수산TV 방송자료
- 현장자료

원칙:

기존 자료를 다시 업로드하거나 복제하는 시스템을 만들지 않는다.

원본은 보존하고
INDEX / LINK / GATEWAY 방식으로 연결한다.

---

## 6. KNOWLEDGE PROVENANCE

모든 방송·상담·추천·판단에 사용되는 정보는
출처 성격을 구분한다.

SOURCE
= 실제 촬영 원본 / 실제 발언

EXPERT_SOURCE
= 전문가 원본자료

OFFICIAL_SOURCE
= 농진청 등 공식자료

FIELD_CASE
= 농민 현장 경험 / PhotoDoctor 사례

JOPD_ARCHIVE
= 기존 한국농수산TV 방송

RESEARCH
= 새 외부 조사자료

PRODUCT_CLAIM
= 기업 또는 제품 측 주장

AI_INFERENCE
= AI 추론

EDITORIAL
= 조PD의 방송 의도와 표현 판단

서로 다른 출처를 동일한 사실 등급으로 취급하지 않는다.

---

## 7. FARMER ENGINE

농민은 단순 회원이 아니다.

K-AGRI의 핵심 현장 데이터 생산자이자 수혜자다.

농민 중심 데이터 흐름:

농민
→ 농장
→ 작물
→ 품종
→ 지역
→ 면적
→ 시기
→ 문제
→ 질문
→ PhotoDoctor
→ 상담
→ 행동
→ 제품/농법 사용
→ 구매
→ 결과

현재 여러 농민 모델이 존재한다.

예:

- farmers
- farmer_profiles
- expo_farmers
- live_farmers
- customers

즉시 강제 통합하지 않는다.

Canonical Farmer Identity와 Adapter를 통해 연결한다.

---

## 8. PHOTO DOCTOR

PhotoDoctor는 단순 사진 판독기가 아니다.

농민의 실제 문제를 감지하는
K-AGRI FIELD SENSOR다.

흐름:

농민
→ 사진
→ 작물
→ 증상
→ 문제 분류
→ 진단 후보
→ 관련 지식
→ 행동지시
→ 필요시 상담
→ 필요한 경우에만 제품/기업 연결
→ 결과 추적

진단과 판매를 동일시하지 않는다.

제품 연결은 근거가 있고 관련성이 있을 때만 수행한다.

PhotoDoctor 데이터는 향후

문제 급증 감지
→ 작가실 소재 발견
→ 전문가 자료 연결
→ 현장 취재
→ 방송
→ 농민 재유입

에도 사용한다.

---

## 9. COMPANY / VENDOR ENGINE

기업은 단순 광고주가 아니다.

K-AGRI EXPO에

제품
기술
농법
서비스
공급능력
현장 검증자료
수출 가능성

을 제시하는 산업 참여자다.

현재 확인된 주요 구조:

vendors
→ booths
→ products

별도 세대:

- vendor_applications
- vendor_applications_v2
- expo_brands
- expo_brand_products
- expo_products
- booth_products

기존 구조를 삭제하지 않는다.

Vendor / Booth / Product의 canonical 관계를 정의하고
기존 테이블은 Adapter로 연결한다.

---

## 10. K-AGRI EXPO

K-AGRI EXPO는 쇼핑몰이 아니다.

기업이 참가하고
농민과 국내·해외 바이어가 참여하는
농업 산업 광장이다.

역할:

- 기업 발견
- 제품 발견
- 기술 발견
- 농법 발견
- 농산물 발견
- 현장 성과 확인
- 상담
- 검증
- Lead 생성
- Buyer 연결
- B2B
- 수출 기회 발굴
- 거래 시작

EXPO는 거래의 끝이 아니라
관계와 거래가 시작되는 장소다.

---

## 11. K-AGRI 365

K-AGRI 365는 EXPO와 동일한 서비스가 아니다.

EXPO:

발견
→ 만남
→ 검증
→ 상담
→ 거래 시작

K-AGRI 365:

반복 구매
→ 지속 거래
→ 공급
→ 주문
→ 배송
→ 정산
→ 관계 유지

즉,

K-AGRI 365 =
"박람회가 끝나지 않는 365일 거래시장"

으로 정의한다.

일반 오픈 쇼핑몰처럼
상품부터 나열하는 구조를 기본으로 하지 않는다.

농민 문제와 필요를 먼저 이해하고
적합한 솔루션과 상품으로 연결한다.

---

## 12. BUYER / GLOBAL ENGINE

K-AGRI는 국내 농민·기업만을 위한 시스템으로 설계하지 않는다.

한국 농업이 해외로 확장될 수 있도록
GLOBAL 구조를 처음부터 고려한다.

현재 확인된 구조:

- buyer_profiles
- buyers
- agri_buyers
- buyer_demands
- buyer_matches
- export_quotes
- agri_trade_offers

향후 연결:

Buyer
→ Demand
→ K-AGRI Matching
→ 기업 / 농가
→ 제품 / 농산물
→ 검증자료
→ Quote
→ Negotiation
→ Trade
→ Export Outcome

필요 데이터는 단계적으로 확장한다.

예:

- 수출 가능 국가
- 생산/공급 능력
- MOQ
- 가격 범위
- 통화
- Incoterms
- 인증
- 포장규격
- 생산시기
- 수출 경험
- 해외용 자료

실제 DB에 없는 필드는
존재한다고 가정하지 않는다.

---

## 13. CONTENT & MEDIA ENGINE

조PD AI 방송국은
K-AGRI의 CONTENT & MEDIA ENGINE이다.

위치:

- src/app/studio
- src/app/api/studio
- src/lib/jopd-studio
- jopd-studio

역할:

사전 조사
→ 취재 설계
→ 촬영
→ 원본 이해
→ 사실 검증
→ 방송 구성
→ 편집
→ 보충자료 판단
→ 본편
→ Shorts
→ EXPO 연결

콘텐츠는 단순 홍보물이 아니다.

농민에게 필요한 정보를 검증하고 전달하며,
기업·제품·농법·현장 성과를
실제 취재와 증거 중심으로 보여준다.

---

## 14. PRE-PRODUCTION BRAIN

자동 방송국은 촬영 후부터 시작하지 않는다.

촬영 전에 작가실이 먼저 움직인다.

촬영 예정 입력
→ K-AGRI Knowledge
→ 전문가 자료
→ 농사캘린더
→ PhotoDoctor
→ 과거 한국농수산TV
→ 관련 콘텐츠
→ 기업/제품 자료
→ 농민 질문
→ Buyer/시장 데이터
→ 필요시 외부 조사
→ 조PD 촬영 작전서

제품 방송에서도 광고문구를 만드는 것이 목적이 아니다.

카메라로 검증할 수 있는 포인트를 찾아
실제 현장에서 확인하는 것이 목적이다.

---

## 15. VIDEO BRAIN

VIDEO BRAIN은 촬영 원본을 이해한다.

원칙:

원본 전체를 보지 않고 이해했다고 선언하지 않는다.

현재 개발 단계:

2.0 FULL DECODE — 완료
2.1 BASE VISUAL COVERAGE — 완료
2.2 ADAPTIVE EVENT DETECTOR — 다음
2.3 MULTIMODAL UNDERSTANDING
2.4 TEMPORAL CONTEXT
2.5 WHOLE SHOOT MEMORY

VIDEO BRAIN은 편집 판단 전에
SOURCE TRUTH를 먼저 확립한다.

---

## 16. JOPD EDITING DNA

조PD의 편집 판단을 별도 학습한다.

기존 작가실 DNA와 구분한다.

학습:

한국농수산TV 완성본
+
가능한 경우 RAW ↔ FINAL
+
AI 편집 ↔ 조PD 수정

을 이용한다.

장르별 DNA를 구축한다.

목표는 일반적인 AI 편집자가 아니라
조PD의 실제 편집 문법을 재현하는 것이다.

---

## 17. CRM / DATA ENGINE

모든 핵심 활동은 CRM과 데이터 흐름으로 연결한다.

예:

콘텐츠 시청
→ EXPO 방문
→ 부스
→ 제품
→ 상담
→ PhotoDoctor
→ Lead
→ 기업 전달
→ 구매
→ 주문
→ 배송
→ 정산
→ 결과

Buyer:

EXPO
→ Buyer Demand
→ Match
→ 기업/농가
→ Quote
→ Trade
→ Outcome

현재 CRM 관련 데이터와 로그가 실제 운영 DB에 존재한다.

새 CRM을 별도로 중복 구축하지 않는다.

---

## 18. LEARNING ENGINE

K-AGRI는 결과를 다시 학습해야 한다.

학습 대상:

- 농민 질문
- PhotoDoctor 문제
- 상담 내용
- 방송 반응
- 제품 관심
- 구매
- 재구매
- 사용 결과
- 기업 반응
- Buyer 수요
- 거래 결과
- 조PD 편집 수정

주의:

조회수나 매출만으로
콘텐츠 품질 또는 농업적 효과를 판정하지 않는다.

여러 원인을 분리해 분석한다.

---

## 19. 공통 논리 객체

K-AGRI 전체에서 다음 객체를 공통 개념으로 사용한다.

FARMER
FARM
CROP
PROBLEM
KNOWLEDGE
CONTENT
SHOOT
VENDOR
BOOTH
PRODUCT
BUYER
DEMAND
LEAD
ORDER
OUTCOME

이것은 곧바로
새 테이블을 14개 만든다는 의미가 아니다.

기존 DB의 실제 테이블을 우선 사용하고
필요한 경우에만 Canonical ID / Link / Adapter를 추가한다.

---

## 20. 데이터 연결 원칙

기존 시스템을 Big Bang 방식으로 갈아엎지 않는다.

기본 구조:

CANONICAL OBJECT
        ↕
IDENTITY / LINK / ADAPTER
        ↕
LEGACY / CURRENT TABLES

기존 운영 기능을 유지하면서
점진적으로 하나의 생태계로 연결한다.

---

## 21. 현재 확인된 주요 실제 관계

운영 Supabase REST 관계 메타데이터 기준
확인된 주요 FK 축:

vendors
→ booths
→ products

profiles
→ farmers

farmers
→ farmer_booths
→ farmer_products
→ farmer_orders

expo_consult_leads
→ expo_lead_assignments
→ vendors
→ expo_conversions

expo_brands
→ expo_brand_products

knowledge_assets
→ knowledge_rules

ai_broadcast_projects
→ ai_broadcast_subtitles

이 관계를 우선 보존한다.

---

## 22. 현재 중복 모델

실제 운영 DB에는 여러 개발 세대가 공존한다.

대표 예:

농민:
farmers / farmer_profiles / expo_farmers / live_farmers / customers

기업:
vendors / expo_brands

상품:
products / booth_products / expo_products / expo_brand_products / farmer_products

주문:
expo_orders / expo_brand_orders / photodoctor_orders / farmer_orders / deal_orders

Buyer:
buyers / buyer_profiles / agri_buyers

Lead:
booth_leads / expo_consult_leads / expo_leads / ai_consult_leads / vendor_leads

원칙:

삭제부터 하지 않는다.
어댑터 없이 강제 통합하지 않는다.
실제 사용처와 데이터 관계를 확인한 후 canonical mapping한다.

---

## 23. SOURCE / KNOWLEDGE / CLAIM 분리

K-AGRI에서 매우 중요한 공통 규칙이다.

농업 정보와 방송 정보 모두

실제 관찰
전문가 지식
공식 지식
현장 경험
기업 주장
AI 추론

을 분리한다.

특히 제품 효과는

PRODUCT_CLAIM
≠
FIELD_CASE
≠
EXPERT_SOURCE
≠
OFFICIAL_SOURCE
≠
VERIFIED_OUTCOME

이다.

이 구분은 방송, PhotoDoctor, 상담, 상품 페이지에 공통 적용한다.

---

## 24. GLOBAL READY 원칙

현재 국내 서비스라도
향후 해외 Buyer와 수출을 막는 구조로 만들지 않는다.

그러나 사용하지 않는 글로벌 기능을
한꺼번에 구현하지 않는다.

원칙:

구조는 GLOBAL READY.
개발은 실제 필요 순서대로.

---

## 25. 개발 우선순위

PHASE 0
MASTER ARCHITECTURE 확정

PHASE 1
DATA MAP / Canonical ID / Adapter / Provenance 확정

PHASE 2
K-AGRI KNOWLEDGE GATEWAY

PHASE 3
PRE-PRODUCTION BRAIN

PHASE 4
JOPD EDITING DNA

PHASE 5
VIDEO BRAIN 2.2
→ 2.3
→ 2.4
→ 2.5

PHASE 6
PD ENGINE / EDIT ENGINE

PHASE 7
CONTENT
↔ EXPO
↔ PhotoDoctor
↔ Farmer
↔ Vendor
↔ Product
↔ Buyer
↔ Order
↔ Outcome

PHASE 8
K-AGRI 365 / GLOBAL 고도화

---

## 26. 개발 금지사항

아키텍처 확정 전 다음을 하지 않는다.

- 기존 테이블 대량 삭제
- 이름이 비슷하다는 이유만으로 DB 통합
- 기존 Knowledge 자료 재업로드
- 기존 CRM 재구축
- 기존 Expo를 쇼핑몰로 축소
- PhotoDoctor를 상품 추천기로 축소
- JOPD AI STUDIO를 일반 AI 영상 생성기로 축소
- GLOBAL을 국내 시스템 완성 후 처음부터 다시 설계
- SOURCE와 AI 추론 혼합
- 원본에 없는 장면을 실제 촬영본처럼 사용

---

## 27. 기준 문서 관계

/BASECAMP.md
= 2026-04 안정 복구점
= 수정 금지

/docs/BASECAMP.md
= K-Agri Expo 운영/CRM 베이스캠프

/docs/KAGRI_MASTER_ARCHITECTURE.md
= K-AGRI 전체 생태계 상위 설계

/docs/KAGRI_DATA_MAP.md
= 실제 운영 DB와 Canonical Object 연결 지도

/jopd-studio/01_ARCHITECTURE.md
= 조PD AI 방송국 내부 아키텍처

/jopd-studio/05_CURRENT_STATE.md
= 조PD AI 방송국 실제 현재 개발 상태

상위 문서와 하위 모듈 문서의 역할을 혼동하지 않는다.

---

## 28. 현재 ARCHITECTURE GATE

다음 개발 전에 반드시:

K-AGRI MASTER ARCHITECTURE 1.0
→ DATA MAP 1.0
→ Canonical ID
→ Adapter
→ Provenance
→ Event / Attribution

순으로 고정한다.

그 후

VIDEO BRAIN 2.2 ADAPTIVE EVENT DETECTOR

개발로 복귀한다.

---

# 한 줄 정의

K-AGRI는

"농민의 문제와 현장의 사실,
전문가의 지식,
기업의 기술과 제품,
바이어의 수요,
조PD의 콘텐츠,
EXPO의 만남,
365일의 거래,
그리고 실제 결과를 하나의 데이터 순환으로 연결하는
대한민국 농업 산업 인텔리전스 플랫폼"

이다.
