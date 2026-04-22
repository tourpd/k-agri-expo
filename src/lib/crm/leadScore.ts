export type LeadInput = {
  inquiry_type?: string;
  quantity_text?: string;
  message?: string;
  region?: string;
  crop?: string;
  source_type?: string;
};

export function calculateLeadScore(input: LeadInput) {
  let score = 0;

  const type = (input.inquiry_type || "").toLowerCase();
  const msg = (input.message || "").toLowerCase();
  const qty = (input.quantity_text || "").toLowerCase();

  // 1. 문의 유형 점수
  if (type.includes("공동구매")) score += 30;
  else if (type.includes("도매")) score += 30;
  else if (type.includes("대량")) score += 25;
  else if (type.includes("가격")) score += 15;
  else if (type.includes("사용법")) score += 10;

  // 2. 수량 점수
  if (qty) {
    if (qty.match(/[0-9]{3,}/)) score += 25;
    else score += 10;
  }

  // 3. 메시지 키워드
  const strongKeywords = ["대량", "바로", "지금", "공급", "가능", "계약"];
  strongKeywords.forEach(k => {
    if (msg.includes(k)) score += 5;
  });

  // 4. 작물 특정성
  if (input.crop && input.crop.length > 1) score += 10;

  // 5. 유입 경로
  if (input.source_type === "youtube") score += 10;
  if (input.source_type === "photodoctor") score += 15;

  // 최대 제한
  if (score > 100) score = 100;

  // 등급
  let is_hot = false;
  if (score >= 70) is_hot = true;

  return {
    score,
    is_hot,
  };
}