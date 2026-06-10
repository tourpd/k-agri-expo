export type AIProductInput = {
  product_name: string;
  category?: string;
  homepage_url?: string;
  youtube_url?: string;
};

export function analyzeProductForFarmers(input: AIProductInput) {
  const name = input.product_name || "제품";

  return {
    product_name: name,
    farmer_problem: `${name}이 해결할 수 있는 농민의 실제 고민을 분석합니다.`,
    target_farmer: "농업 현장에서 문제 해결이 필요한 농민",
    sales_type: "general_sale",
    conversion_score: 75,
    hero_headline: `${name}, 농민에게 필요한 이유가 분명해야 팔립니다.`,
    hero_subheadline:
      "AI가 제품 설명을 농민이 이해하는 문제 중심 문구로 바꿉니다.",
    selling_points: [
      "농민 문제 중심으로 설명",
      "사용 시기와 기대 효과 명확화",
      "상세페이지와 광고 문구 자동 생성",
    ],
    image_prompts: [
      `${name} 제품을 농민이 사용하는 광고형 장면`,
      `${name}이 필요한 농업 현장 문제 상황`,
      `${name} 사용 후 만족하는 농민 이미지`,
    ],
  };
}