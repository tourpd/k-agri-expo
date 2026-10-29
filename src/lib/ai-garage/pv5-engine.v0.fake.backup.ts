export interface UserProfile {
  dream: string;
  people?: string;
  budget?: string;
  hobby?: string;
  work?: string;
}

export interface DesignResult {
  vehicle: string;
  concept: string;
  summary: string;
  modules: string[];
  estimate: string;
  build_time: string;
  image_prompts: string[];
  next_questions: string[];
}

export function analyzeLifestyle(profile: UserProfile) {

  const text = JSON.stringify(profile).toLowerCase();

  let vehicle = "PV5 Passenger";
  let concept = "라이프스타일형";

  if (
    text.includes("유튜브") ||
    text.includes("촬영") ||
    text.includes("편집") ||
    text.includes("사무실")
  ) {
    vehicle = "PV5 Cargo High Roof";
    concept = "크리에이터 투어링";
  }

  if (
    text.includes("농장") ||
    text.includes("작업") ||
    text.includes("운반")
  ) {
    vehicle = "PV5 Openbed";
    concept = "아웃도어 워크캠프";
  }

  if (
    text.includes("휠체어") ||
    text.includes("복지")
  ) {
    vehicle = "PV5 WAV";
    concept = "케어 모빌리티";
  }

  return {
    vehicle,
    concept
  };
}

export function generateDesign(
  profile: UserProfile
): DesignResult {

  const life = analyzeLifestyle(profile);

  return {
    vehicle: life.vehicle,

    concept: life.concept,

    summary:
      `${life.vehicle} 기반으로 ` +
      `${life.concept} 설계를 추천합니다.`,

    modules: [
      "슬라이딩 침대",
      "수납 시스템",
      "냉장고",
      "전동 어닝",
      "인산철 배터리",
      "태양광 시스템"
    ],

    estimate:
      "6,000만원~8,000만원",

    build_time:
      "3~6주",

    image_prompts: [
      `${life.vehicle} exterior photorealistic`,
      `${life.vehicle} interior photorealistic`,
      `${life.concept} lifestyle scene`
    ],

    next_questions: [
      "몇 명이 사용할 예정인가요?",
      "예산은 어느 정도인가요?",
      "가장 중요한 용도는 무엇인가요?"
    ]
  };
}
