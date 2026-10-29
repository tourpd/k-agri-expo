const fs = require("fs");

const files = {
"data/mobility/kia/pv5/official/pv5_passenger.md": `
# PV5 Passenger

## 핵심 개념
사람 중심 라이프스타일 플랫폼

## 주요 활용
- 부부 여행
- 가족 여행
- 은퇴 여행
- 차박
- 캠핑
- 이동 오피스
- 크리에이터
`,

"data/mobility/kia/pv5/official/pv5_cargo.md": `
# PV5 Cargo

## 핵심 개념
비즈니스 이동 플랫폼

## 주요 활용
- 커피차
- 푸드트럭
- 과일상점
- 이동판매
- 유튜브 스튜디오
- 이동 오피스
`,

"data/mobility/kia/pv5/official/pv5_openbed.md": `
# PV5 Openbed

## 핵심 개념
작업과 아웃도어 플랫폼

## 주요 활용
- 농장 작업
- 축산
- 과수
- 캠핑
- 낚시
- 오프로드
- 레저
`,

"data/mobility/kia/pv5/official/pv5_wav.md": `
# PV5 WAV

## 핵심 개념
복지와 케어 플랫폼

## 주요 활용
- 장애인 이동
- 실버케어
- 병원
- 방문 진료
- 공공 서비스
`,

"data/mobility/kia/pv5/youtube/001_pv5_camping_690.md": `
# PV5 캠핑 패키지 분석

## 핵심
고객은 옵션을 사는 것이 아니라
완성된 삶을 구매한다.

## 발견
- 침대
- 어닝
- 냉장고
- 수납
`,

"data/mobility/kia/pv5/youtube/002_pv5_highroof.md": `
# PV5 하이루프 분석

## 핵심
사람들은 차를 보는 것이 아니라
공간을 본다.

## 활용
- 이동 오피스
- 유튜브 스튜디오
- 낚시 베이스캠프
- 장기 여행
`,

"data/mobility/kia/pv5/youtube/003_pv5_limousine.md": `
# PV5 리무진 분석

## 핵심
VIP 이동 공간

## 활용
- 이동 회의실
- 방송 제작
- 농업 컨설팅
- 프리미엄 투어
`,

"data/mobility/kia/pv5/youtube/004_pv5_mobile_space.md": `
# PV5 모바일 스페이스 분석

## 핵심
자동차가 아니라
이동 공간 플랫폼
`,

"data/mobility/kia/pv5/lifestyle/camping.md": `
# Camping Lifestyle

필수 요소:
- 침대
- 냉장고
- 어닝
- 태양광
`,

"data/mobility/kia/pv5/lifestyle/fishing.md": `
# Fishing Lifestyle

필수 요소:
- 낚시 수납
- 냉동고
- 세척 공간
- 취침 공간
`,

"data/mobility/kia/pv5/lifestyle/mobile_office.md": `
# Mobile Office

필수 요소:
- 데스크
- 모니터
- 배터리
- 스타링크
`,

"data/mobility/kia/pv5/lifestyle/creator.md": `
# Creator Studio

필수 요소:
- 카메라 수납
- 조명
- 편집실
- 송출 장비
`,

"data/mobility/kia/pv5/lifestyle/business.md": `
# Business Mobility

활용:
- 커피차
- 과일상점
- 푸드트럭
- 이동판매
`,

"data/mobility/kia/pv5/lifestyle/care.md": `
# Care Mobility

활용:
- 실버케어
- 병원
- 장애인 이동
- 복지 서비스
`
};

for (const [path, content] of Object.entries(files)) {
  fs.mkdirSync(path.split("/").slice(0,-1).join("/"), {recursive:true});
  fs.writeFileSync(path, content.trim(), "utf8");
  console.log("CREATED:", path);
}

console.log("\\nK-AGRI PV5 KNOWLEDGE BASE CREATED");
