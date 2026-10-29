# K-AGRI 365 MASTER GAP MAP

상태: CURRENT REALITY BASELINE

## 1. 현재 확인된 결론

K-AGRI는 새로 만드는 플랫폼이 아니다.

현재 프로젝트에는 이미 다음 핵심 축이 존재한다.

- 농민
- 기업/벤더
- K-AGRI EXPO
- 포토닥터
- 농산물/시장
- 국내외 바이어
- 거래
- 주문
- 배송
- 정산
- CRM
- 작가실
- 한국농수산TV 콘텐츠 기능
- JOPD AI ENGINE
- K-AGRI Core

따라서 다음 개발의 중심은
'기능 추가'가 아니라
'기존 기능의 연결 완성'이다.

---

# 2. 현재 축별 판정

| 축 | 현재 상태 | 판정 |
|---|---|---|
| 농민 | Farmer, Farmer CRM, PhotoDoctor, 농민 의사결정 등 존재 | 강함 |
| 기업 | Vendor, Booth, Product, Lead, Order, Settlement 존재 | 매우 강함 |
| EXPO | 다수 Hall/Booth/Product/Event/Deal 기능 존재 | 매우 강함 |
| 콘텐츠 | 작가실 + Studio + VIDEO BRAIN + PD 관련 기능 존재 | 강함 |
| 포토닥터 | 상담→추천→주문→CRM 구조 존재 | 강함 |
| 거래 | 주문/배송/정산/매출 기능 존재 | 강함 |
| CRM | Lead/Inbox/Farmer CRM/Vendor Lead 존재 | 강함 |
| 바이어 | Buyer/Demand/Trade/Export Quote 관련 기능 존재 | 중간 이상 |
| 소비자 | Customer Asset/Activity와 일부 Market 존재 | 상대적으로 약함 |
| K-AGRI 365 | 명시적 365 통합 구조는 약함 | 핵심 보강 대상 |

---

# 3. 가장 큰 문제

기능 부족보다 연결 부족 가능성이 크다.

현재 구조는

농민 시스템
기업 시스템
EXPO
포토닥터
콘텐츠
바이어
거래
CRM

이 각각 상당히 만들어져 있다.

하지만 최종 목표는 각각의 시스템이 존재하는 것이 아니다.

하나의 행동이 다음 행동으로 연결되어야 한다.

---

# 4. 농민 JOURNEY

목표:

농민
→ 작물/지역/재배정보
→ 현재 문제
→ 포토닥터/지식
→ 관련 현장 콘텐츠
→ 해결 방법
→ 관련 기업/제품
→ 상담
→ 구매
→ 배송
→ 사용
→ 결과
→ Farmer CRM
→ 다음 농사캘린더/추천

현재 자산:

- /farmer
- /farmer/dashboard
- /expo/farmer-decision
- /expo/farmer-voice
- /photodoctor/*
- /problems/*
- /expo/products
- /expo/booths
- /order
- /order-status
- /admin/farmer-crm

핵심 과제:

각 기능 사이의 ID와 행동 이력을 연결한다.

---

# 5. 기업 JOURNEY

목표:

기업
→ 입점 신청
→ 승인
→ 부스
→ 제품/기술 등록
→ 콘텐츠
→ 현장 검증
→ 농민 발견
→ 문의/Lead
→ 상담
→ 주문
→ 배송
→ 정산
→ 성과
→ 재참가/365 지속 관계

현재 자산:

- /vendor/apply
- /vendor/dashboard
- /vendor/booth
- /vendor/products
- /vendor/content
- /vendor/leads
- /vendor/orders
- /vendor/settlements
- /expo/brands
- /expo/booths
- /expo/brand-products

판정:

기능은 상당 부분 존재한다.

핵심 과제는
콘텐츠→Lead→주문→성과 Attribution 연결이다.

---

# 6. 소비자 JOURNEY

목표:

소비자
→ 한국농수산TV/콘텐츠
→ 농가 발견
→ 생산과정 확인
→ 농산물 발견
→ 신뢰
→ 구매
→ 배송
→ 후기/재구매
→ 생산자와 지속 관계

현재 확인된 자산:

- /expo/agri-exchange/market
- /expo/future-food/health-market
- /market/live
- customer-assets
- customer-activity

판정:

다른 축에 비해 상대적으로 약하다.

중요:

소비자용 기능을 별도 쇼핑몰처럼 만들기 전에
기존 농가/콘텐츠/농산물/주문 구조와 연결 가능한지 먼저 확인한다.

---

# 7. BUYER / GLOBAL JOURNEY

목표:

국내외 바이어
→ 가입/검증
→ 품목 탐색
→ 농가/기업 발견
→ 공급능력 확인
→ 수요 등록
→ 매칭
→ 상담
→ 견적
→ 계약
→ 거래
→ 수출
→ 지속 거래

현재 자산:

- /buyer
- /buyer/dashboard
- /buyer/signup
- /api/buyer/demand
- /expo/agri-trade
- /expo/agri-trade/register
- /admin/buyers
- /admin/trade-offers
- export quote API

판정:

기본 골격은 존재한다.

핵심 과제:

Buyer Demand
→ Farmer/Vendor/Asset
→ Match
→ Quote
→ Contract
→ Transaction

실제 연결 여부를 검증해야 한다.

---

# 8. CONTENT JOURNEY

목표:

K-AGRI 데이터
→ 사전 작가실
→ 취재
→ 원본 촬영
→ VIDEO BRAIN
→ JOPD EDITING DNA
→ PD ENGINE
→ 방송
→ 관련 농가/제품/기업/문제 연결
→ 시청 행동
→ 상담/거래
→ 성과
→ 다음 콘텐츠

현재 자산:

- /admin/kagri-writers-room/*
- /studio
- /studio/rough-cut
- /studio/editor
- /api/studio/*
- /expo/vendor/content

판정:

콘텐츠 생산 기반은 존재한다.

핵심 과제:

Studio를 독립 편집툴로 끝내지 않고
K-AGRI Entity와 연결한다.

예:

content
→ farmer_id
→ vendor_id
→ product_id
→ crop
→ problem
→ knowledge_source
→ expo destination
→ lead
→ order
→ result

---

# 9. PHOTODOCTOR JOURNEY

목표:

농민 문제
→ 사진/질문
→ 판단
→ 지식
→ 관련 콘텐츠
→ 상담
→ 필요 시 제품
→ 주문
→ 사용 결과
→ 새로운 FIELD CASE

현재 자산:

- PhotoDoctor UI
- Consult
- Lead
- Product
- Recommendation
- Order
- Tracking
- CRM

판정:

K-AGRI 전체 Journey의 핵심 진입점으로 활용할 수 있다.

---

# 10. COMMERCE JOURNEY

현재 자산:

- Orders
- Product Orders
- Event Orders
- PhotoDoctor Orders
- Vendor Orders
- Payment
- Tracking
- Settlement
- Revenue

목표:

각 주문 시스템을 무조건 합치는 것이 아니다.

공통 식별 체계를 통해

누가
무엇을 보고
왜 문의했고
어떤 상담을 받고
무엇을 구매했고
어느 업체 매출이 되었으며
어떤 결과가 나왔는가

를 추적 가능하게 한다.

---

# 11. K-AGRI CONNECTION SPINE

앞으로 가장 중요한 것은 공통 연결축이다.

최소 연결 대상:

ACTOR
- farmer
- vendor
- consumer
- buyer
- expert

ASSET
- crop
- farm
- product
- company
- agricultural_product
- knowledge
- content

INTENT
- problem
- inquiry
- demand
- interest

ACTION
- view
- search
- consult
- lead
- recommendation
- purchase
- order
- quote
- contract
- export

RESULT
- delivery
- settlement
- field_result
- repurchase
- business_result

모든 기능을 하나의 거대한 테이블로 합치지 않는다.

기존 시스템은 유지하고
공통 ID/Event/Link 계층으로 연결한다.

---

# 12. 앞으로의 개발 판단 순서

기존 기능 발견
↓
기존 DB/API 확인
↓
중복 여부 확인
↓
현재 Journey에서 끊어진 지점 확인
↓
기존 기능끼리 연결 가능한지 확인
↓
연결 우선
↓
정말 없을 때만 새 기능 개발

---

# 13. 우선순위

## PRIORITY 1
K-AGRI CONNECTION SPINE

농민/기업/소비자/바이어/콘텐츠/거래를
기존 시스템을 파괴하지 않고 연결할 공통 축 확인.

## PRIORITY 2
4대 USER JOURNEY 연결

- Farmer
- Vendor
- Consumer
- Buyer

## PRIORITY 3
CONTENT ↔ COMMERCE 연결

한국농수산TV/JOPD 콘텐츠가
농가·기업·제품·문제·거래와 연결되도록 한다.

## PRIORITY 4
PHOTODOCTOR ↔ KNOWLEDGE ↔ COMMERCE

문제 해결이 중심이고
제품 판매는 필요한 경우에만 뒤따른다.

## PRIORITY 5
CONSUMER 축 보강

농가와 생산과정과 콘텐츠를 기반으로
농산물 거래를 연결한다.

## PRIORITY 6
BUYER/GLOBAL 완성

Demand
→ Match
→ Quote
→ Contract
→ Export

흐름을 완성한다.

## PRIORITY 7
LEARNING LOOP

모든 결과가 다시

K-AGRI BRAIN
작가실
농사캘린더
PhotoDoctor
콘텐츠
기업 성과

로 돌아가도록 한다.

---

# 14. JOPD AI ENGINE 현재 작업의 위치

VIDEO BRAIN 2.0
→ 완료

VIDEO BRAIN 2.1
→ 완료

VIDEO BRAIN 2.2
→ 진행 중

이 작업은 계속 필요하다.

단,

VIDEO BRAIN 자체가 최종 프로젝트가 아니다.

K-AGRI의 현장 취재 데이터를
정확한 콘텐츠 자산으로 만드는
CONTENT & MEDIA ENGINE의 일부다.

---

# 15. 최종 개발 원칙

앞으로 질문은

"무엇을 더 만들까?"

가 아니다.

"이미 만든 것 가운데 무엇과 무엇이 끊어져 있는가?"

를 먼저 묻는다.

그리고 그 연결이

농민
기업
소비자
바이어

모두가 365일 K-AGRI 안에서
지식·콘텐츠·문제해결·거래로 연결되는 데
기여하는지를 기준으로 개발한다.
