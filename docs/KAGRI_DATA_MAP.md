# K-AGRI DATA MAP 1.0

최종 업데이트: 2026-09-19
상태: DATA MAP LOCK CANDIDATE

근거:
- 운영 Supabase REST OpenAPI Schema
- KAGRI_SUPABASE_SCHEMA 실사
- KAGRI_RELATIONSHIP_CHECK 실사
- 실제 프로젝트 코드 조사

원칙:
테이블 이름이 비슷하다는 이유만으로 통합하지 않는다.
실제 FK, 실제 데이터, 실제 코드 사용처를 우선한다.

---

# 1. 전체 논리 객체

K-AGRI 공통 논리 객체:

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

이 객체 이름은 논리 모델이다.

동일 이름의 새 DB 테이블을
무조건 생성한다는 뜻이 아니다.

---

# 2. IDENTITY ROOT

## USER / PROFILE

현재 확인:

profiles

실제 관계:

profiles.user_id
→ farmers.user_id

profiles.user_id
→ buyers.user_id

판단:

profiles는 로그인 사용자 Identity의
기존 핵심 연결점으로 유지한다.

모든 농민/바이어/기업 데이터를
profiles에 강제로 합치지 않는다.

---

# 3. FARMER

관련 기존 테이블:

- farmers
- farmer_profiles
- expo_farmers
- live_farmers
- customers
- farmer_assets
- farmer_sessions

## 우선 기준

현재 실제 FK 구조상:

profiles
→ farmers

가 가장 명확한 농민 Identity 축이다.

따라서 신규 K-AGRI 연결에서
farmers.farmer_id를
우선 Farmer Domain ID 후보로 사용한다.

단,

farmer_profiles
expo_farmers
live_farmers
customers

를 즉시 폐기하거나 병합하지 않는다.

---

# 4. FARM

관련:

- farms
- farm_actions
- farm_calendar
- farm_events
- farm_images
- farm_photos
- farm_voice

확인된 실제 관계:

farm_actions.farm_id
→ farms.id

원칙:

농민과 농장은 다른 객체다.

한 농민이 여러 농장을 가질 수 있는 구조를 막지 않는다.

FARMER
≠
FARM

---

# 5. FARMER COMMERCE

실제 확인된 축:

farmers
→ farmer_booths
→ farmer_products
→ farmer_orders

FK:

farmer_booths.farmer_id
→ farmers.farmer_id

farmer_products.farmer_id
→ farmers.farmer_id

farmer_products.booth_id
→ farmer_booths.booth_id

farmer_orders.farmer_id
→ farmers.farmer_id

farmer_orders.product_id
→ farmer_products.product_id

판단:

이 축은 농민이 생산한 농산물/상품 판매 구조로 보존한다.

기업 농자재 판매축과 강제로 합치지 않는다.

---

# 6. VENDOR

관련:

- vendors
- vendor_applications
- vendor_applications_v2
- vendor_capabilities
- vendor_verifications
- vendor_documents
- vendor_leads
- vendor_settlements

## 우선 기준

vendors.vendor_id

를 현재 기업 Domain ID의
우선 기준으로 사용한다.

이유:

실제 FK로 booths와 연결되고
Expo Lead Assignment/Conversion과도 연결된다.

---

# 7. VENDOR APPLICATION

현재:

vendor_applications
vendor_applications_v2

두 세대가 존재한다.

실제 데이터도 존재한다.

원칙:

v2를 이름만 보고 기존 데이터를 삭제하지 않는다.

신규 입점 승인 흐름의 실제 코드 사용처를 기준으로
active application model을 판단한다.

기존 신청 데이터는 보존한다.

---

# 8. BOOTH

우선 기준:

booths.booth_id

실제 관계:

booths.vendor_id
→ vendors.vendor_id

따라서:

VENDOR
→ BOOTH

를 K-AGRI EXPO 기업 전시의
핵심 관계로 유지한다.

Booth는 Vendor와 동일 객체가 아니다.

한 기업이 향후 여러 전시/부스/테마에 참여할 가능성을 막지 않는다.

---

# 9. PRODUCT — 기업 농자재

현재 관련:

- products
- booth_products
- expo_products
- expo_brand_products

## 우선 기준축

현재 실제 운영 FK:

products.booth_id
→ booths.booth_id

PhotoDoctor:

photodoctor_orders.product_id
→ products.product_id

추천 규칙도:

product recommendation
→ products.product_id

따라서 현재 농자재/기업 상품의
우선 Product Domain 축은:

vendors
→ booths
→ products

로 정한다.

---

# 10. booth_products

booth_products에는:

product_id
booth_id
vendor_id

가 존재하며

booth_id
→ booths.booth_id

vendor_id
→ vendors.vendor_id

FK가 확인된다.

또한 booth_product_assets가
booth_products.product_id를 참조한다.

판단:

booth_products는 실제 사용 중인 별도 상품 세대다.

즉시 products에 병합하지 않는다.

향후 PRODUCT ADAPTER에서
products와 booth_products의 의미와 사용처를 매핑한다.

---

# 11. EXPO BRAND PRODUCT

별도 축:

expo_brands
→ expo_brand_products
→ expo_brand_product_images

이 구조도 실제 FK가 있다.

판단:

브랜드 전시/CMS 계열로 유지한다.

기업 commerce canonical product와
즉시 강제 통합하지 않는다.

필요한 경우 Product Link Adapter를 사용한다.

---

# 12. PHOTO DOCTOR

주요 데이터:

- photodoctor_raw_logs
- photodoctor_consults
- photodoctor_recommend_rules
- photodoctor_orders

실제 상품 연결:

photodoctor_orders.product_id
→ products.product_id

현재 주문에는:

farmer_name
farmer_phone
crop
diagnosis
issue
diagnosis_id
source
product_id
order/payment/shipping/settlement

등이 존재한다.

## 현재 결손

photodoctor_orders에는
canonical farmer FK가 확인되지 않았다.

따라서:

PhotoDoctor Person
→ Farmer Identity

연결이 향후 Adapter 과제다.

전화번호만으로 DB를 강제 병합하지 않는다.

Identity Matching 절차를 둔다.

---

# 13. PROBLEM

현재 농민 문제는 하나의 중앙 Problem 테이블로
완전히 통합되어 있지 않다.

문제 신호는 여러 곳에 존재한다.

예:

PhotoDoctor:
crop
diagnosis
issue
issue_type

Lead:
crop
crop_key
issue_key
interest_topic
consult_text

Knowledge:
작물/문제/행동지시

농사캘린더:
작물/월/생육단계/문제/action

원칙:

PROBLEM은 K-AGRI의 핵심 논리 객체로 정의한다.

그러나 지금 당장 새 problem master를 만들지 않는다.

먼저 기존 문제 표현을
Problem Adapter / Normalization 규칙으로 연결한다.

---

# 14. KNOWLEDGE

확인된 주요 구조:

- knowledge_file_jobs
- knowledge_page_index
- knowledge_assets
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

실제 FK 확인:

knowledge_rules.knowledge_id
→ knowledge_assets.id

판단:

기존 Knowledge Vault를 폐기하지 않는다.

새 지식 저장소를 중복 생성하지 않는다.

K-AGRI KNOWLEDGE GATEWAY를 통해
기존 자산을 검색/연결한다.

---

# 15. KNOWLEDGE TRUST

기존 파생 데이터가 존재한다고 해서
자동으로 검증된 농업 지식으로 취급하지 않는다.

Provenance:

SOURCE
EXPERT_SOURCE
OFFICIAL_SOURCE
FIELD_CASE
JOPD_ARCHIVE
RESEARCH
PRODUCT_CLAIM
AI_INFERENCE
EDITORIAL

을 별도 관리한다.

기존 자동 추출 rules/shorts/broadcast materials는
필요시 재검증한다.

---

# 16. CONTENT

현재 관련:

- content_links
- youtube_assets
- youtube_asset_rules
- youtube_content_assets
- kagri_content_dna
- ai_broadcast_projects
- ai_broadcast_subtitles

현재 content_links:

content_id
booth_id
title
url

실제 FK:

content_links.booth_id
→ booths.booth_id

## 결론

현재 Content Link는 너무 좁다.

CONTENT
→ BOOTH

연결은 가능하지만

CONTENT
→ FARMER
→ PROBLEM
→ KNOWLEDGE
→ PRODUCT
→ BUYER
→ ORDER
→ OUTCOME

전체 Attribution은 아직 표현하지 못한다.

---

# 17. JOPD CONTENT

조PD AI STUDIO의:

SOURCE
SHOOT
PROJECT
SCENE
EDIT
OUTPUT

은 기존 Expo content_links와 동일 개념이 아니다.

조PD 내부 제작 데이터는
JOPD Studio Domain에서 관리하고

최종 공개 콘텐츠가 생성될 때
K-AGRI CONTENT Identity와 연결한다.

원본 영상 Source ID와
YouTube 공개 Content ID를 혼동하지 않는다.

---

# 18. JOPD EDITING DNA

현재:

kagri_content_dna

테이블이 존재하지만
조PD Editing DNA 데이터가 존재한다고 판단하지 않는다.

기존 kagri_content_dna
≠
JOPD EDITING DNA

이다.

조PD Editing DNA는:

RAW
→ FINAL
→ JoPD correction

관계를 학습해야 한다.

---

# 19. LEAD

관련:

- booth_leads
- expo_consult_leads
- expo_leads
- ai_consult_leads
- vendor_leads
- deal_leads

## 가장 구조화된 Expo Lead 축

expo_consult_leads
→ expo_lead_assignments
→ vendors
→ expo_conversions

실제 FK:

expo_lead_assignments.lead_id
→ expo_consult_leads.lead_id

expo_lead_assignments.vendor_id
→ vendors.vendor_id

expo_conversions.lead_id
→ expo_consult_leads.lead_id

expo_conversions.assignment_id
→ expo_lead_assignments.assignment_id

expo_conversions.vendor_id
→ vendors.vendor_id

판단:

Expo 상담→기업배정→성과 흐름은
이 축을 우선 보존한다.

다른 Lead 모델은 Adapter 대상으로 둔다.

---

# 20. BUYER

관련:

- buyer_profiles
- buyers
- agri_buyers

실제 FK:

buyers.user_id
→ profiles.user_id

따라서 로그인 기반 Buyer Domain에서는
buyers.buyer_id를 우선 기준 후보로 둔다.

하지만 agri_buyers는 실제 농산물 거래 시스템에서
별도로 사용되므로 폐기하지 않는다.

buyer_profiles도 가입/승인 흐름을 확인하면서 유지한다.

---

# 21. BUYER DEMAND

관련:

- buyer_demands
- buyer_matches

목표 흐름:

BUYER
→ DEMAND
→ MATCH
→ VENDOR/FARMER
→ QUOTE
→ TRADE
→ OUTCOME

현재 모든 ID 관계가 FK로 강제되어 있다고
가정하지 않는다.

Adapter/validation 계층에서 연결을 보강한다.

---

# 22. GLOBAL / EXPORT

관련:

- export_quotes
- agri_trade_offers
- agri_buyers
- buyer_demands
- buyer_matches

현재 Lead에도:

country
language
is_foreign
trade_type
estimated_volume
quote_status
deal_amount
contract_status

등 글로벌 거래 관련 필드가 존재한다.

따라서 GLOBAL은 완전 신규 개념이 아니다.

기존 구조를 확장한다.

---

# 23. ORDER

현재 여러 주문 모델:

- expo_orders
- expo_brand_orders
- photodoctor_orders
- farmer_orders
- deal_orders

이들은 서로 다른 판매 흐름에서 생성됐다.

즉시 하나의 orders 테이블로 강제 이전하지 않는다.

논리적으로:

ORDER
        ↓
ORDER SOURCE TYPE
        ↓
EXPO / BRAND / PHOTODOCTOR / FARMER / DEAL

로 본다.

향후 Unified Order View 또는 Adapter를 우선 검토한다.

---

# 24. SETTLEMENT

현재 PhotoDoctor 주문에도:

platform_fee_rate
platform_fee_amount
vendor_settlement_amount
settlement_status

가 존재한다.

별도:

commission_rules
vendor settlements
agri settlements
settlement logs

등도 존재한다.

원칙:

주문 테이블을 먼저 합치기보다
공통 Settlement 계산/조회 Adapter를 만든다.

---

# 25. OUTCOME

K-AGRI에서 주문은 최종 결과가 아니다.

필요한 Outcome:

농민:
- 사용 여부
- 실제 효과
- 문제 해결 여부
- 재구매
- 실패/부작용/미해결

기업:
- 상담
- 견적
- 판매
- 반복 거래
- 현장 검증

Buyer:
- Match
- Quote
- Contract
- Trade
- Export

Content:
- 상담 유입
- 문제 해결 연결
- 구매 연결
- 후속 현장 결과

현재 Outcome 데이터는 여러 시스템에 분산되어 있다.

단일 outcome table을 즉시 만들지 않는다.

먼저 Event/Attribution 설계를 확정한다.

---

# 26. CRM

현재:

crm_logs
crm_inbox
crm_outbox
crm_recommended_actions
customer_activity_logs

등이 존재한다.

CRM을 새로 만들지 않는다.

K-AGRI 공통 객체 ID를
기존 CRM 활동과 연결한다.

---

# 27. CANONICAL ID 1.0

현재 우선 규칙:

USER
→ profiles.user_id

FARMER
→ farmers.farmer_id

FARM
→ farms.id

VENDOR
→ vendors.vendor_id

BOOTH
→ booths.booth_id

ENTERPRISE PRODUCT
→ products.product_id

FARMER PRODUCT
→ farmer_products.product_id

BUYER
→ buyers.buyer_id

EXPO CONSULT LEAD
→ expo_consult_leads.lead_id

CONTENT
→ 기존 content_links.content_id는 공개 콘텐츠 링크 ID로 유지하되
JOPD source/project ID와 동일시하지 않는다.

KNOWLEDGE
→ 기존 knowledge asset ID 체계를 우선 보존한다.

ORDER
→ 현재 단일 canonical physical table 없음.
source_type + source_order_id 논리 방식으로 연결한다.

PROBLEM
→ 현재 단일 canonical physical table 없음.
Normalization/Adapter 우선.

OUTCOME
→ 현재 단일 canonical physical table 없음.
Event/Attribution 설계 후 결정.

---

# 28. ADAPTER RULE 1.0

Adapter는 기존 데이터를 파괴하지 않고
공통 논리 객체로 읽기 위한 계층이다.

예:

Farmer Adapter
farmers
farmer_profiles
expo_farmers
live_farmers
customers
→ FARMER VIEW

Product Adapter
products
booth_products
expo_products
expo_brand_products
farmer_products
→ PRODUCT VIEW

Buyer Adapter
buyers
buyer_profiles
agri_buyers
→ BUYER VIEW

Order Adapter
expo_orders
expo_brand_orders
photodoctor_orders
farmer_orders
deal_orders
→ ORDER VIEW

Lead Adapter
expo_consult_leads
booth_leads
expo_leads
ai_consult_leads
vendor_leads
deal_leads
→ LEAD VIEW

Adapter는 원본 테이블의 ID를 버리지 않는다.

항상:

source_system
source_table
source_id

를 추적할 수 있어야 한다.

---

# 29. PROVENANCE RULE 1.0

K-AGRI의 판단 결과에는
가능한 경우 다음 정보를 추적한다.

provenance_type
source_system
source_table
source_id
source_file
source_page
source_timecode
created_at
verified_at
verification_status

모든 객체에 이 컬럼을 억지로 추가한다는 뜻이 아니다.

공통 Link/Event/Provenance 계층에서 표현한다.

---

# 30. EVENT / ATTRIBUTION 필요 구조

K-AGRI가 궁극적으로 알아야 하는 것:

어떤 콘텐츠를 보고
어떤 농민/Buyer가 들어왔고
무슨 문제에 관심을 가졌으며
어떤 부스/기업/제품을 봤고
어떤 상담을 했고
어떤 주문/거래가 생겼으며
결과가 어땠는가.

논리 흐름:

CONTENT
→ VISIT
→ FARMER / BUYER
→ PROBLEM / DEMAND
→ BOOTH
→ PRODUCT
→ LEAD
→ CONSULT
→ ORDER / QUOTE
→ OUTCOME

이 연결은 기존 개별 테이블에
수십 개 FK를 추가하는 방식보다

공통 Event/Link 계층을 우선 검토한다.

---

# 31. PRODUCT CLAIM 안전 규칙

기업 상품의:

효과
기능
수량
경제성
수확량
품질 개선

등은 기업 입력만으로
검증 사실이 되지 않는다.

PRODUCT_CLAIM으로 시작한다.

이후:

현장 사례
전문가 자료
공식 자료
촬영 증거
실제 Outcome

와 각각 별도 연결한다.

---

# 32. CONTENT COMMERCE 규칙

방송이 상품을 다룰 수 있다.

그러나:

CONTENT
→ PRODUCT

연결이 있다고 해서

"방송이 제품 효과를 보증한다"

는 의미가 아니다.

방송은 다음을 구분한다.

- 기업 주장
- 농민 경험
- 실제 촬영 증거
- 전문가 설명
- 공식 근거
- 조PD의 편집적 설명

---

# 33. PHOTO DOCTOR COMMERCE 규칙

PhotoDoctor:

진단 후보
→ 행동지시
→ 필요시 상담

이 먼저다.

제품은 문제 해결에 실제 관련성이 있을 때
후속 연결한다.

PhotoDoctor를 자동 판매 추천기로 만들지 않는다.

---

# 34. K-AGRI 365 DATA 원칙

K-AGRI 365는
새로운 고립 쇼핑 DB를 만드는 것이 목표가 아니다.

기존:

VENDOR
BOOTH
PRODUCT
FARMER
BUYER
ORDER
SETTLEMENT
CRM

을 최대한 재사용한다.

365는 이 데이터 위에서
지속 거래 경험을 제공하는 Commerce Layer다.

---

# 35. GLOBAL DATA 원칙

국내와 해외를 완전히 분리된 DB로 만들지 않는다.

Buyer/Lead/Demand/Quote/Trade에
국가/언어/거래조건을 확장할 수 있도록 한다.

그러나 실제로 필요하지 않은 필드를
추측으로 추가하지 않는다.

---

# 36. 현재 보존할 핵심 축

A. Identity

profiles
→ farmers
→ buyers

B. Enterprise

vendors
→ booths
→ products

C. Farmer Commerce

farmers
→ farmer_booths
→ farmer_products
→ farmer_orders

D. Expo Lead

expo_consult_leads
→ expo_lead_assignments
→ vendors
→ expo_conversions

E. PhotoDoctor Commerce

PhotoDoctor
→ products
→ photodoctor_orders

F. Knowledge

knowledge assets
→ knowledge rules / actions / content materials

G. Content

JOPD STUDIO
→ published content
→ content_links / future attribution

---

# 37. 아직 LOCK하지 않는 것

다음은 추가 검증 없이
물리 DB 구조를 확정하지 않는다.

- 단일 Problem Master Table
- 단일 Order Table
- 단일 Product Table 강제 이전
- 단일 Farmer Table로 과거 데이터 migration
- 단일 Buyer Table로 강제 migration
- 새 Outcome Table
- 새 Event Table
- 새 Universal Link Table
- 새 JOPD DNA Table

필요성이 확인된 뒤 최소 구조로 만든다.

---

# 38. 다음 설계 게이트

MASTER ARCHITECTURE 1.0
완료

DATA MAP 1.0
완료

다음:

1. Canonical ID 규칙 코드화 범위 결정
2. Adapter 구현 위치 결정
3. Provenance/Event 최소 스키마 결정
4. Knowledge Gateway 연결점 결정
5. JOPD Studio와 K-AGRI Content Identity 연결점 결정

그 후:

VIDEO BRAIN 2.2
ADAPTIVE EVENT DETECTOR

개발로 복귀한다.

---

# 핵심 결론

K-AGRI의 현재 DB는
처음부터 다시 만들어야 할 빈 시스템이 아니다.

이미 여러 실제 운영축이 존재한다.

따라서 전략은:

삭제
→ 재구축

이 아니라

보존
→ 식별
→ 연결
→ 표준화
→ 학습

이다.
