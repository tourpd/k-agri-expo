# K-AGRI 자료화면 AI DB센터 V1 완료 기준점

2026.06.16 기준 자료화면 AI DB센터 V1 파이프라인을 1차 완료한다.

## 완료된 흐름

PPT / PPTX / PDF / DOC / DOCX / HWP / HWPX
→ 페이지 이미지화
→ knowledge_visual_pages 저장
→ GPT Vision 분석
→ 판단규칙 생성
→ 방송소재 생성
→ 쇼츠소재 생성
→ 농민상담답변 생성
→ 행동지시 생성

## 생성·연결된 핵심 테이블

- knowledge_visual_pages
- knowledge_decision_rules
- knowledge_broadcast_materials
- knowledge_shorts_materials
- knowledge_farmer_consulting_answers
- knowledge_action_instructions

## 현재 의미

이 단계는 자료창고가 아니라 K-AGRI BRAIN의 원재료 처리 공장이다.

안이영 PPT, 농진청 자료, 병해충 PDF, HWP, Word 문서 등을 넣으면
페이지 단위로 분해되고 AI 분석을 거쳐 판단·콘텐츠·행동지시 후보로 전환된다.

## 아직 남은 일

1. 분석 품질 고도화
   - 작물
   - 병해충
   - 생육단계
   - 발생조건
   - 농민실수
   - 월별 작업
   - 콘텐츠 아이디어
   - 판매포인트

2. 작가실 엔진 연결
   - 방송기획안
   - 쇼츠 대본
   - 웹툰/시트콤 소재
   - 강의안
   - 카드뉴스
   - 상세페이지

3. 외부 자료 확장
   - 한국농수산TV 유튜브
   - 도프/코리아아그로 유튜브
   - 농진청/농사로 홈페이지
   - 업체 홈페이지
   - 외장하드 원본 촬영본

## 최종 목적

자료를 보관하는 것이 아니라,
농민에게 전달할 정확한 콘텐츠와 판매에 도움이 되는 상세페이지·쇼츠·방송소재를 자동 생성하는 것이다.
