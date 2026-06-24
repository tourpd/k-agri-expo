# K-AGRI EXPO ARCHITECTURE RULES

## 🚨 절대 금지
- sed로 JSX 삽입 금지
- import 위에 HTML 삽입 금지
- grep + patch 방식 DOM 수정 금지

## ✅ 허용 방식
- page.tsx는 항상 "완성 구조"로 교체
- 모든 UI는 React Component 단위로만 관리
- 삽입은 반드시 JSX tree 내부에서만 수행

## 🧠 구조 원칙
1. CropValueSearchHero (검색)
2. 농민의 선택!! (핵심 CTA)
3. PhotoDoctor (의사결정/진단)
4. AgriTradeCenter (거래소)
5. Event / Media / Extension 영역

## ⚠️ 유지 원칙
- UI 순서는 언제든 변경 가능하지만
- 구조 파괴 방식 수정은 금지
