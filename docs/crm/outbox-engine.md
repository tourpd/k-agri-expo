# K-AGRI CRM Outbox Engine

## 1. 목적
vendor_leads에서 조건에 맞는 리드를 자동으로 crm_outbox 큐에 적재하는 자동화 시스템

---

## 2. 전체 흐름
vendor_leads
→ cron (1분 실행)
→ crm_outbox (READY)
→ worker (SENT 처리)

---

## 3. 핵심 SQL

INSERT INTO crm_outbox (lead_id, status, created_at)
SELECT v.id, 'READY', now()
FROM vendor_leads v
WHERE v.repurchase_score >= 10
AND NOT EXISTS (
  SELECT 1 FROM crm_outbox o
  WHERE o.lead_id = v.id
);

---

## 4. cron
- 1분마다 실행
- INSERT만 담당
- 비즈니스 로직 없음

---

## 5. 중복 방지
- SQL: NOT EXISTS
- DB: UNIQUE(lead_id)

---

## 6. 상태
READY → SENT → FAILED

---

## 7. 원칙
- cron은 판단하지 않는다
- SQL은 선택만 한다
- 발송은 worker가 한다
