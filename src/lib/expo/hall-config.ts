export type ExpoHallId =
  | "crop_nutrition"
  | "pest_solution"
  | "machinery_equipment"
  | "seeds_seedlings"
  | "smart_agri_ai"
  | "future_food_insect";

export const EXPO_HALLS: Record<
  ExpoHallId,
  {
    label: string;
    shortLabel: string;
    description: string;
    entryLabel: string;
    mode: "dose_calculator" | "solution" | "quote" | "reservation" | "consulting" | "b2b_story";
  }
> = {
  crop_nutrition: {
    label: "작물영양관",
    shortLabel: "영양",
    description: "비대 · 활력 · 뿌리 · 회복 · 칼슘 솔루션",
    entryLabel: "작물영양관 입장",
    mode: "dose_calculator",
  },
  pest_solution: {
    label: "병해충솔루션관",
    shortLabel: "병해충",
    description: "살충 · 살균 · 친환경 병해충 관리",
    entryLabel: "병해충관 입장",
    mode: "solution",
  },
  machinery_equipment: {
    label: "농기계·장비관",
    shortLabel: "농기계",
    description: "농기계 · 드론 · 자동화 장비",
    entryLabel: "농기계관 입장",
    mode: "quote",
  },
  seeds_seedlings: {
    label: "종자·육묘관",
    shortLabel: "종자육묘",
    description: "종자 · 모종 · 육묘기술",
    entryLabel: "종자육묘관 입장",
    mode: "reservation",
  },
  smart_agri_ai: {
    label: "스마트농업·AI관",
    shortLabel: "스마트AI",
    description: "AI · 센서 · 스마트팜",
    entryLabel: "스마트농업관 입장",
    mode: "consulting",
  },
  future_food_insect: {
    label: "미래식량·곤충관",
    shortLabel: "미래식량",
    description: "곤충 · 기능성식품 · 대체단백",
    entryLabel: "미래식량관 입장",
    mode: "b2b_story",
  },
};

export function getHallLabel(hallId?: string | null) {
  if (!hallId) return "-";
  return EXPO_HALLS[hallId as ExpoHallId]?.label || hallId;
}

export function getHallMode(hallId?: string | null) {
  if (!hallId) return null;
  return EXPO_HALLS[hallId as ExpoHallId]?.mode || null;
}