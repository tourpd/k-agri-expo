export function fallbackDesign(message: string) {
  const text = message.toLowerCase();

  let vehicle = "PV5 Cargo";
  let concept = "AI 라이프 모빌리티 설계안";
  let why = "닫힌 실내 공간을 활용해 생활, 업무, 수납을 함께 설계하기 좋습니다.";

  if (text.includes("농장") || text.includes("작업") || text.includes("운반") || text.includes("오픈베드")) {
    vehicle = "PV5 Openbed";
    concept = "아웃도어 작업형";
    why = "흙, 물, 장비, 자재를 싣는 실제 작업에는 오픈베드가 유리합니다.";
  }

  if (text.includes("캠핑") || text.includes("차박") || text.includes("여행")) {
    concept = "캠핑 · 차박형";
  }

  if (text.includes("유튜브") || text.includes("촬영") || text.includes("사무실") || text.includes("편집")) {
    vehicle = "PV5 Cargo High Roof";
    concept = "크리에이터 이동사무실형";
    why = "촬영 장비 수납, 편집 데스크, 전기 시스템을 구성하기 좋습니다.";
  }

  if (text.includes("휠체어") || text.includes("복지") || text.includes("병원")) {
    vehicle = "PV5 WAV";
    concept = "복지 · 케어 이동형";
    why = "휠체어 이동, 보호자 동승, 병원 이동 목적에 맞습니다.";
  }

  return {
    vehicle,
    concept,
    summary: why,
    feasibility: "초기 가능. 실제 실측과 업체 견적 필요.",
    estimated_price_range: "6,000만~8,000만원",
    estimated_build_time: "3~6주",
    recommended_modules: [
      "전기 시스템",
      "수납 모듈",
      "전동 어닝",
      "냉장고",
      "작업/생활 테이블"
    ],
    image_prompts: [
      `${vehicle} exterior realistic lifestyle vehicle, ${concept}`,
      `${vehicle} interior realistic conversion, ${concept}`,
      `${vehicle} sleeping or working mode, practical Korean mobility design`
    ],
    next_questions: [
      "몇 명이 주로 이용하나요?",
      "예산 범위는 어느 정도인가요?",
      "캠핑, 업무, 작업 중 가장 중요한 목적은 무엇인가요?"
    ]
  };
}
