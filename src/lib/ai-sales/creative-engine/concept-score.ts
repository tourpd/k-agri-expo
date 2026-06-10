import type { CreativeConcept } from "./industry-concepts";

export type ConceptScore = {
  concept: CreativeConcept;
  label: string;
  score: number;
  reason: string;
};

export const conceptLabels: Record<CreativeConcept, string> = {
  rural_sitcom: "농촌 시트콤",
  fear: "공포·손해회피형",
  comparison: "비교형",
  expert: "전문가 설명형",
  documentary: "현장 다큐형",
  news: "뉴스·긴급속보형",
  investment: "투자회수형",
  premium: "프리미엄형",
  family: "가족·선물형",
  review: "후기·증언형",
  live_commerce: "라이브커머스형",
  parody: "패러디형",
  shorts_meme: "쇼츠 밈형",
  before_after: "비포·애프터형",
  urgent_groupbuy: "공동구매 마감형",
  emotional_drama: "감성 드라마형",
  field_test: "현장 실험형",
  subsidy: "보조사업 상담형",
  seasonal_alert: "시즌 경보형",
};

export function scoreConcepts({
  primaryConcepts,
  optionalConcepts,
  avoidConcepts = [],
}: {
  primaryConcepts: CreativeConcept[];
  optionalConcepts: CreativeConcept[];
  avoidConcepts?: CreativeConcept[];
}): ConceptScore[] {
  const scores: ConceptScore[] = [];

  primaryConcepts.forEach((concept, index) => {
    scores.push({
      concept,
      label: conceptLabels[concept],
      score: Math.max(96 - index * 3, 82),
      reason: "산업군 핵심 판매 문법과 가장 잘 맞습니다.",
    });
  });

  optionalConcepts.forEach((concept, index) => {
    if (primaryConcepts.includes(concept)) return;

    scores.push({
      concept,
      label: conceptLabels[concept],
      score: Math.max(78 - index * 3, 60),
      reason: "보조 콘텐츠나 테스트 광고로 활용하기 좋습니다.",
    });
  });

  return scores
    .filter((item) => !avoidConcepts.includes(item.concept))
    .sort((a, b) => b.score - a.score);
}
