export function farmerDecisionEngine(crop: string): {
  crop: string;
  risk: number;
  trend: number;
  decision: string;
  message: string;
} {
  const cleanCrop = crop.trim();
  const seed = cleanCrop.length || 1;

  const risk = (seed * 37) % 100;
  const trend = (seed * 13) % 3;

  let decision = "WAIT";
  let message = "시장 상황을 더 지켜보세요";

  if (risk > 70) {
    decision = "SELL";
    message = "지금 출하하는 것이 유리합니다";
  } else if (trend === 2) {
    decision = "HOLD";
    message = "가격 상승 가능성이 있습니다";
  } else if (trend === 0) {
    decision = "RISK";
    message = "가격 하락 위험이 있습니다";
  }

  return {
    crop: cleanCrop,
    risk,
    trend,
    decision,
    message,
  };
}
