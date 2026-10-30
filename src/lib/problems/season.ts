/**
 * 시기 엔진 — 지금 달에 맞는 작물·증상·준비물 순서를 정합니다.
 *
 * 홈·작물 페이지·강의 주제 추천이 전부 이 표를 봅니다.
 * 월이 바뀌면 자동으로 바뀌고, 대표님은 이 표만 고치면 됩니다.
 *
 * 등급: "now" 지금 한창 / "prep" 준비·예약 시기 / "rest" 월동·휴면·끝남
 */
import type { CropKey, SymptomKey } from "./catalog";

export type SeasonGrade = "now" | "prep" | "rest";

export type MonthPlan = {
  month: number;
  headline: string;
  crops: Partial<Record<CropKey, { grade: SeasonGrade; note: string }>>;
  /** 이달에 자주 묻는 증상 순서 */
  symptoms: SymptomKey[];
  /** 이달의 준비물 (needs.ts의 slug) */
  needs: string[];
};

const PLANS: MonthPlan[] = [
  {
    month: 11,
    headline: "시설하우스 철입니다. 딸기·토마토·오이는 지금, 참외·수박은 묘 준비, 노지는 월동.",
    crops: {
      strawberry: { grade: "now", note: "응애·흰가루 초기 관리, 벌 투입, 보온 시작" },
      tomato: { grade: "now", note: "가루이 예찰, 환기·결로 관리, 칼슘 공급" },
      cucumber: { grade: "now", note: "노균병·가루이, 보온과 환기 균형" },
      paprika: { grade: "now", note: "총채벌레·흰가루, 야간 보온" },
      leafy: { grade: "now", note: "상추·시금치 노균병, 저온기 생육" },
      citrus: { grade: "now", note: "수확기, 열과·착색" },
      melon: { grade: "prep", note: "접목묘 예약, 육묘상 준비, 정식 전 토양 소독" },
      apple: { grade: "prep", note: "수확 후 회복, 낙엽 정리, 동해 예방" },
      cabbage: { grade: "now", note: "김장 수확, 무름병 점검" },
      garlic: { grade: "rest", note: "월동 중 — 피복·배수 확인" },
      onion: { grade: "rest", note: "월동 중 — 피복·배수 확인" },
      gochu: { grade: "rest", note: "노지 끝남 — 밭 정리, 시설 고추는 '파프리카·시설고추' 참고" },
      rice: { grade: "rest", note: "수확 끝 — 볏짚 환원, 녹비 파종" },
    },
    symptoms: ["insects", "mold", "growth", "fruit-crack", "yellow-leaf", "wilting", "spots", "poor-color", "root"],
    needs: [
      "greenhouse-heating",
      "thermal-curtain",
      "ventilation-humidity",
      "grafted-seedlings",
      "pollinator-bees",
      "sticky-traps",
      "soil-sterilize",
      "drip-irrigation",
      "led-supplement",
      "sprayer",
      "pruning-tools",
      "mulch-film",
    ],
  },
  {
    month: 12,
    headline: "본격 난방기. 시설 작물 생육 유지, 참외·수박 정식, 노지는 휴면.",
    crops: {
      strawberry: { grade: "now", note: "수확 시작, 잿빛곰팡이·응애" },
      tomato: { grade: "now", note: "저온기 착과, 결로" },
      cucumber: { grade: "now", note: "노균병, 보온" },
      paprika: { grade: "now", note: "저온기 관리" },
      melon: { grade: "now", note: "정식, 활착" },
      leafy: { grade: "now", note: "저온 생육" },
      citrus: { grade: "now", note: "수확·저장" },
      apple: { grade: "rest", note: "전정 준비" },
      garlic: { grade: "rest", note: "월동" },
      onion: { grade: "rest", note: "월동" },
      cabbage: { grade: "rest", note: "끝남" },
      gochu: { grade: "prep", note: "내년 육묘 계획" },
      rice: { grade: "rest", note: "휴면" },
    },
    symptoms: ["mold", "insects", "growth", "wilting", "yellow-leaf", "fruit-crack", "spots", "poor-color", "root"],
    needs: ["greenhouse-heating", "thermal-curtain", "ventilation-humidity", "grafted-seedlings", "pollinator-bees", "sticky-traps", "led-supplement", "drip-irrigation", "sprayer", "pruning-tools"],
  },
];

/** 해당 월 계획 (없으면 가장 가까운 달) */
export function getMonthPlan(month = new Date().getMonth() + 1): MonthPlan {
  const exact = PLANS.find((p) => p.month === month);
  if (exact) return exact;
  // 아직 안 만든 달은 가장 가까운 달로
  return PLANS.reduce((best, p) => {
    const d = Math.min(Math.abs(p.month - month), 12 - Math.abs(p.month - month));
    const bd = Math.min(Math.abs(best.month - month), 12 - Math.abs(best.month - month));
    return d < bd ? p : best;
  }, PLANS[0]);
}

export function cropGrade(crop: CropKey, month?: number): { grade: SeasonGrade; note: string } {
  const plan = getMonthPlan(month);
  return plan.crops[crop] ?? { grade: "prep", note: "" };
}

export const GRADE_LABEL: Record<SeasonGrade, string> = {
  now: "지금",
  prep: "준비",
  rest: "월동·휴면",
};
