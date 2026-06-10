export type ParodyStyle = {
  id: string;
  label: string;
  safeDescription: string;
  bestFor: string[];
};

export const parodyLibrary: ParodyStyle[] = [
  {
    id: "royal_clown",
    label: "왕의남자 스타일",
    safeDescription:
      "사극 광대가 농사 문제를 풍자하는 형식",
    bestFor: ["agriculture", "produce"],
  },

  {
    id: "rural_drama",
    label: "전원일기 스타일",
    safeDescription:
      "농촌 사람들 관계 중심",
    bestFor: ["agriculture", "farmtour"],
  },

  {
    id: "survival_game",
    label: "생존게임 스타일",
    safeDescription:
      "선택 못 하면 손해",
    bestFor: ["health", "agriculture"],
  },

  {
    id: "workplace_drama",
    label: "미생 스타일",
    safeDescription:
      "농장을 회사처럼 표현",
    bestFor: ["smartfarm", "futurefood"],
  },

  {
    id: "variety_challenge",
    label: "예능 챌린지 스타일",
    safeDescription:
      "미션 수행 구조",
    bestFor: ["agriculture", "health"],
  },
];
