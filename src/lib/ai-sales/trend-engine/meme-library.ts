export type MemeFormat = {
  id: string;
  label: string;
  description: string;
  bestFor: string[];
};

export const memeLibrary: MemeFormat[] = [
  {
    id: "street_interview",
    label: "길거리 인터뷰 밈",
    description: "짧은 질문과 반전 답변",
    bestFor: ["agriculture", "health", "produce"],
  },
  {
    id: "pov",
    label: "POV 밈",
    description: "시청자가 주인공",
    bestFor: ["agriculture", "machinery"],
  },
  {
    id: "breaking_news",
    label: "뉴스속보 밈",
    description: "긴급상황 후킹",
    bestFor: ["agriculture", "seed", "dryer"],
  },
  {
    id: "reaction_cut",
    label: "리액션 밈",
    description: "표정으로 웃김",
    bestFor: ["agriculture", "produce"],
  },
  {
    id: "farm_vlog",
    label: "농촌 브이로그",
    description: "농민 일상형",
    bestFor: ["agriculture", "futurefood"],
  },
];