# K-AGRI 관리자 메뉴 재설계 기준

## 문제

현재 /admin 하위 메뉴가 너무 많고 기능 중심으로 흩어져 있다.
앞으로는 기능 기준이 아니라 사용자와 업무 기준으로 묶는다.

## 최상위 메뉴 7개

### 1. K-AGRI BRAIN
내부 AI 두뇌 엔진

포함:
- visual-knowledge : 자료센터
- knowledge-assets : 지식자산
- decision-rules : 판단규칙 검수센터
- action-instructions : 행동지시 검수센터
- broadcast-materials : 방송소재 검수센터
- youtube-assets : 유튜브 자산
- news-analyzer : 뉴스 분석
- truth-center : 진실센터

### 2. 농민 운영센터
농민 프로필, 상담, 위험, 작업지시

포함:
- farmer-profiles
- farmer-assets
- farmer-crm
- photodoctor-consults
- pest-alerts
- pest-predictor
- today-work
- farm-action-engine

### 3. 농산물 자산·거래센터
저장농산물, 가공, 바이어, 거래

포함:
- agri-assets
- storage-assets
- processors
- process-offers
- buyers
- trade-offers
- agri-exchange-control
- video-call-control

### 4. 콘텐츠·방송센터
조세환PD용 콘텐츠 생산라인

포함:
- kagri-writers-room
- ai-broadcast-station
- creative-room
- video-factory
- video-generator
- shorts-generator
- live-broadcast
- live-control
- media

### 5. 판매·CRM 센터
주문, 공동구매, 고객, 문자, 캠페인

포함:
- orders
- product-orders
- event-orders
- crm
- customer-activity
- customer-assets
- groupbuy-generator
- sms-generator
- sms-logs
- campaign-center
- promotions
- sales-automation
- sales-channels
- sales-offers

### 6. 브랜드·업체센터
입점업체, 브랜드, 정산, 승인

포함:
- vendors
- vendor
- vendor-applications
- vendor-payments
- approval-center
- booths
- products
- brand-matching
- commission-rules
- settlements
- billing

### 7. 시스템·홈페이지 관리
CMS, 배너, 설정, 유저, 수익

포함:
- dashboard
- cms
- expo
- expo-home
- hero
- banner-generator
- settings
- users
- revenue
- agri-revenue
- bank
- deposit-match

## 핵심 원칙

1. 메뉴는 기능명이 아니라 업무명이어야 한다.
2. 농민이 보는 화면과 관리자가 보는 화면을 절대 섞지 않는다.
3. BRAIN 내부 화면은 농민용이 아니다.
4. 농민용 결과 화면은 별도로 만든다.
5. 관리자 화면은 “검수·승인·반려·보류”가 중심이다.
6. 데이터를 보여주는 화면이 아니라 의사결정을 돕는 화면이어야 한다.

## 다음 개발 우선순위

1. /admin/k-agri-command-center 를 관리자 허브로 재정비한다.
2. 위 7개 그룹으로 메뉴를 묶는다.
3. 기존 산발적 메뉴는 허브에서만 접근하게 한다.
4. 판단규칙센터와 행동지시센터는 AI 검수센터로 유지한다.
5. 농민용 위험센터는 별도 신규 개발한다.
