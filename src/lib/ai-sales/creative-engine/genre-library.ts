export type GenreItem = {
  id: string;
  label: string;
  description: string;
  bestFor: string[];
};

export const genreLibrary: GenreItem[] = [
  {
    id: "rural_sitcom",
    label: "농촌 시트콤",
    description: "농민 대화극, 코믹 반전, 충청도 말투 중심.",
    bestFor: ["agriculture", "seed", "livestock"],
  },
  {
    id: "expert_review",
    label: "전문가 리뷰형",
    description: "기능, 성능, 비교, 신뢰를 중심으로 설명.",
    bestFor: ["machinery", "smartfarm", "solar", "drone"],
  },
  {
    id: "documentary",
    label: "현장 다큐형",
    description: "한국농수산TV 현장 취재처럼 문제와 해결을 보여줌.",
    bestFor: ["agriculture", "machinery", "futurefood", "healing"],
  },
  {
    id: "news_show",
    label: "뉴스 속보형",
    description: "긴급 이슈, 병해충, 가격, 마감, 보조사업에 적합.",
    bestFor: ["agriculture", "seed", "dryer", "solar"],
  },
  {
    id: "home_shopping",
    label: "홈쇼핑형",
    description: "혜택, 구성, 가격, 마감 압박 중심.",
    bestFor: ["health", "processed", "produce", "fishery"],
  },
  {
    id: "historical_comedy",
    label: "사극 코믹형",
    description: "사극 말투와 광대극 구조로 문제를 풍자.",
    bestFor: ["agriculture", "produce", "futurefood"],
  },
  {
    id: "movie_trailer",
    label: "영화 예고편형",
    description: "강한 영상미, 웅장한 내레이션, 문제 해결 서사.",
    bestFor: ["machinery", "drone", "smartfarm", "futurefood"],
  },
  {
    id: "comparison_test",
    label: "비교 실험형",
    description: "기존 방식과 새 방식을 직접 비교.",
    bestFor: ["machinery", "agriculture", "dryer", "drone"],
  },
  {
    id: "emotional_drama",
    label: "감성 드라마형",
    description: "가족, 부모님, 자녀, 농장 승계 감정 중심.",
    bestFor: ["health", "healing", "produce", "futurefood"],
  },
];
