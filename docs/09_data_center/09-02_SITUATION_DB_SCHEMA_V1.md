# 09-02. SITUATION DB SCHEMA V1

## 목적

SITUATION DB는 K-AGRI의 심장이다.

한국농수산TV, 안이영, 농진청, 코리아아그로, 포토닥터, CRM, 댓글, 전화상담 등 모든 자료를
영상이나 문서 단위가 아니라 "농민 상황" 단위로 저장한다.

---

## 핵심 정의

상황이란 다음 조합이다.

작물 + 지역 + 시기 + 문제 + 원인 + 해결 + 결과 + 감정 + 제품 + 출처

---

## 기본 흐름

데이터 원천
→ 자막/문서/상담내용 추출
→ 상황 추출
→ SITUATION DB 저장
→ 지식그래프 연결
→ 콘텐츠 추천
→ CRM 연결
→ 사업 제안

---

## SITUATION DB 필드

| 필드명 | 의미 |
|---|---|
| situation_id | 상황 고유 ID |
| source_type | 출처 유형 |
| source_name | 출처 이름 |
| source_id | 원본 ID |
| source_url | 원본 링크 |
| title | 원본 제목 |
| crop | 작물 |
| region | 지역 |
| season | 시기 |
| growth_stage | 생육단계 |
| weather_context | 기상 상황 |
| problem | 문제 |
| problem_type | 문제 유형 |
| cause | 원인 |
| solution | 해결 |
| result | 결과 |
| emotion | 농민 감정 |
| farmer_quote | 농민 발언 |
| expert_quote | 전문가 발언 |
| product | 제품 |
| company | 회사 |
| material_type | 농자재 유형 |
| cost_info | 비용 정보 |
| roi_hint | ROI 단서 |
| content_angle | 콘텐츠 관점 |
| chulsoo_point | 철수 투입 포인트 |
| business_point | 사업 연결 포인트 |
| confidence_score | 추출 신뢰도 |
| status | 처리 상태 |
| created_at | 생성일 |
| updated_at | 수정일 |

---

## source_type 표준값

- KOAF_TV
- ANIYOUNG
- RDA
- KOREA_AGRO
- PHOTO_DOCTOR
- CRM
- COMMENT
- CALL
- INTERVIEW
- COMPANY_DATA
- PRODUCT_DATA

---

## problem_type 표준값

- 병해
- 충해
- 생리장해
- 수량감소
- 품질저하
- 가격문제
- 노동력문제
- 비용문제
- 시설문제
- 토양문제
- 기상문제
- 판로문제

---

## emotion 표준값

- 불안
- 답답함
- 분노
- 걱정
- 희망
- 감사
- 성취
- 체념
- 놀람
- 신뢰

---

## status 표준값

- raw
- extracted
- reviewed
- approved
- rejected

---

## 예시

```json
{
  "situation_id": "SIT-000001",
  "source_type": "KOAF_TV",
  "source_name": "한국농수산TV",
  "title": "고추 열과 줄이는 방법",
  "crop": "고추",
  "region": "전남 고흥",
  "season": "6월",
  "growth_stage": "착과기",
  "weather_context": "장마 전 고온다습",
  "problem": "열과",
  "problem_type": "생리장해",
  "cause": "칼슘결핍과 수분불균형",
  "solution": "칼슘 관주와 배수관리",
  "result": "열과 감소",
  "emotion": "불안",
  "product": "칼슘제",
  "company": "",
  "content_angle": "장마 전 고추 열과 예방",
  "chulsoo_point": "남조선 고추는 비 오면 터지는구만?",
  "business_point": "칼슘제 캠페인 가능",
  "confidence_score": 0.82,
  "status": "extracted"
}
mkdir -p docs/09_data_center docs/04_content sql/schema

cat > docs/09_data_center/09-02_SITUATION_DB_SCHEMA_V1.md <<'EOF'
# 09-02. SITUATION DB SCHEMA V1

## 목적

SITUATION DB는 K-AGRI의 심장이다.

한국농수산TV, 안이영, 농진청, 코리아아그로, 포토닥터, CRM, 댓글, 전화상담 등 모든 자료를
영상이나 문서 단위가 아니라 "농민 상황" 단위로 저장한다.

---

## 핵심 정의

상황이란 다음 조합이다.

작물 + 지역 + 시기 + 문제 + 원인 + 해결 + 결과 + 감정 + 제품 + 출처

---

## 기본 흐름

데이터 원천
→ 자막/문서/상담내용 추출
→ 상황 추출
→ SITUATION DB 저장
→ 지식그래프 연결
→ 콘텐츠 추천
→ CRM 연결
→ 사업 제안

---

## SITUATION DB 필드

| 필드명 | 의미 |
|---|---|
| situation_id | 상황 고유 ID |
| source_type | 출처 유형 |
| source_name | 출처 이름 |
| source_id | 원본 ID |
| source_url | 원본 링크 |
| title | 원본 제목 |
| crop | 작물 |
| region | 지역 |
| season | 시기 |
| growth_stage | 생육단계 |
| weather_context | 기상 상황 |
| problem | 문제 |
| problem_type | 문제 유형 |
| cause | 원인 |
| solution | 해결 |
| result | 결과 |
| emotion | 농민 감정 |
| farmer_quote | 농민 발언 |
| expert_quote | 전문가 발언 |
| product | 제품 |
| company | 회사 |
| material_type | 농자재 유형 |
| cost_info | 비용 정보 |
| roi_hint | ROI 단서 |
| content_angle | 콘텐츠 관점 |
| chulsoo_point | 철수 투입 포인트 |
| business_point | 사업 연결 포인트 |
| confidence_score | 추출 신뢰도 |
| status | 처리 상태 |
| created_at | 생성일 |
| updated_at | 수정일 |

---

## source_type 표준값

- KOAF_TV
- ANIYOUNG
- RDA
- KOREA_AGRO
- PHOTO_DOCTOR
- CRM
- COMMENT
- CALL
- INTERVIEW
- COMPANY_DATA
- PRODUCT_DATA

---

## problem_type 표준값

- 병해
- 충해
- 생리장해
- 수량감소
- 품질저하
- 가격문제
- 노동력문제
- 비용문제
- 시설문제
- 토양문제
- 기상문제
- 판로문제

---

## emotion 표준값

- 불안
- 답답함
- 분노
- 걱정
- 희망
- 감사
- 성취
- 체념
- 놀람
- 신뢰

---

## status 표준값

- raw
- extracted
- reviewed
- approved
- rejected

---

## 예시

```json
{
  "situation_id": "SIT-000001",
  "source_type": "KOAF_TV",
  "source_name": "한국농수산TV",
  "title": "고추 열과 줄이는 방법",
  "crop": "고추",
  "region": "전남 고흥",
  "season": "6월",
  "growth_stage": "착과기",
  "weather_context": "장마 전 고온다습",
  "problem": "열과",
  "problem_type": "생리장해",
  "cause": "칼슘결핍과 수분불균형",
  "solution": "칼슘 관주와 배수관리",
  "result": "열과 감소",
  "emotion": "불안",
  "product": "칼슘제",
  "company": "",
  "content_angle": "장마 전 고추 열과 예방",
  "chulsoo_point": "남조선 고추는 비 오면 터지는구만?",
  "business_point": "칼슘제 캠페인 가능",
  "confidence_score": 0.82,
  "status": "extracted"
}
