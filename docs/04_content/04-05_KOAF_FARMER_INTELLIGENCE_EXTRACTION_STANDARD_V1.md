# 04-05. KOAF FARMER INTELLIGENCE EXTRACTION STANDARD V1

## 목적

한국농수산TV 영상은 단순 콘텐츠가 아니다.

8년 동안 대한민국 농민들의 생각, 고민, 실패, 성공, 감정, 의사결정이 축적된 집단 기억이다.

K-AGRI는 영상을 요약하지 않는다.

영상을 농민 인텔리전스로 변환한다.

---

# 배경

기존 방식

영상
↓
요약
↓
보관
↓
사실상 재사용 불가

---

K-AGRI 방식

영상
↓
상황 추출
↓
농민 행동 추출
↓
농민 감정 추출
↓
의사결정 추출
↓
시장 신호 추출
↓
사업 기회 추출
↓
콘텐츠 기회 추출
↓
Situation DB 저장
↓
지속 재사용

---

# 핵심 철학

한국농수산TV의 진짜 자산은 농업 기술이 아니다.

진짜 자산은

- 농민의 생각
- 농민의 판단
- 농민의 실패
- 농민의 성공
- 농민의 생존 전략
- 농민의 시장 감각

이다.

---

# 추출 단위

영상 단위 저장 금지

상황(Situation) 단위 저장

---

예시

작물 : 고추

지역 : 고흥

시기 : 6월

문제 : 총채벌레

원인 : 고온

행동 : 약제 교체

결과 : 회복

감정 : 불안 → 안심

↓

Situation 1건 생성

---

# 추출 구조

## 1. Situation

필수

- crop
- region
- season
- growth_stage
- problem
- cause
- action
- result

---

## 2. Farmer Problem

- farmer_problem
- problem_category
- urgency_score

---

## 3. Farmer Emotion

- emotion
- emotion_trigger

---

## 4. Farmer Decision

- decision
- decision_reason
- expected_result
- actual_result

---

## 5. Farmer Success

- success_factor
- estimated_profit
- reproducible

---

## 6. Farmer Failure

- failure_factor
- estimated_loss
- lesson_learned

---

## 7. Market Signal

- market_signal
- direction
- confidence_score

---

## 8. Regional Signal

- region
- signal
- trend

---

## 9. Business Opportunity

- opportunity_type
- opportunity_score
- estimated_demand

---

## 10. Content Opportunity

- content_title
- content_type
- urgency

---

## 11. Chulsoo Point

- chulsoo_point
- humor_type
- twist_type

---

# 추가 추출 항목

## 판매 관련

- 언제 팔았는가
- 왜 팔았는가
- 결과는 어땠는가

---

## 작목 선택

- 왜 심었는가
- 누구 말을 들었는가
- 결과는 어땠는가

---

## 유통

- 어디에 판매했는가
- 누구에게 판매했는가
- 만족도는 어땠는가

---

# K-AGRI 활용처

## 콘텐츠실

- 방송 소재
- 쇼츠 소재
- 철수 콘텐츠

## 사업실

- 공동구매
- 캠페인
- B2B

## 포토닥터

- 문제 매칭

## CRM

- 상담 추천

## 작가실

- 상황 데이터 제공

## 안이영

- 전문가 지식 매칭

---

# 절대 금지

영상 요약 저장

단순 문장 저장

하드코딩

특정 작물 전용 설계

특정 병해충 전용 설계

특정 제품 전용 설계

---

# 최종 목표

한국농수산TV 1393편을

영상 데이터가 아니라

대한민국 농민 행동 데이터베이스로 전환한다.

---

한 문장 정의

우리는 영상을 분석하는 것이 아니다.

대한민국 농민의 생각, 행동, 감정, 의사결정을 데이터화하는 것이다.
