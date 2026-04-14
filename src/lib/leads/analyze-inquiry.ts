export type InquiryDetectionResult = {
  quantityDetected: boolean;
  priceDetected: boolean;
  quoteIntentDetected: boolean;
  exportIntentDetected: boolean;
  score: number;
  hotLead: boolean;
  summary: string;
};

function hasAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

export function analyzeInquiry(message: string): InquiryDetectionResult {
  const text = (message || "").toLowerCase();

  const quantityPatterns = [
    /\b\d+\s?(kg|kgs)\b/i,
    /\b\d+\s?(ton|tons)\b/i,
    /\b\d+\s?(box|boxes)\b/i,
    /\b\d+\s?(ea|pcs|pieces)\b/i,
    /\bcontainer\b/i,
    /\bmoq\b/i,
    /수량/,
    /물량/,
    /톤/,
    /kg/,
    /박스/,
    /컨테이너/,
    /월\s?\d+/,
  ];

  const pricePatterns = [
    /\bprice\b/i,
    /\bunit price\b/i,
    /\bbest price\b/i,
    /\bquotation\b/i,
    /\bquote\b/i,
    /\bfob\b/i,
    /\bcif\b/i,
    /가격/,
    /단가/,
    /견적/,
    /얼마/,
    /비용/,
  ];

  const quoteIntentPatterns = [
    /\bquote\b/i,
    /\bquotation\b/i,
    /\bestimate\b/i,
    /견적/,
    /단가/,
    /가격 문의/,
  ];

  const exportIntentPatterns = [
    /\bexport\b/i,
    /\bimport\b/i,
    /\bfob\b/i,
    /\bcif\b/i,
    /\bincoterm\b/i,
    /\bshipment\b/i,
    /수출/,
    /수입/,
    /선적/,
    /통관/,
  ];

  const quantityDetected = hasAny(text, quantityPatterns);
  const priceDetected = hasAny(text, pricePatterns);
  const quoteIntentDetected = hasAny(text, quoteIntentPatterns);
  const exportIntentDetected = hasAny(text, exportIntentPatterns);

  let score = 0;
  if (quantityDetected) score += 30;
  if (priceDetected) score += 30;
  if (quoteIntentDetected) score += 20;
  if (exportIntentDetected) score += 20;

  const hotLead = score >= 50;

  const reasons: string[] = [];
  if (quantityDetected) reasons.push("수량 언급");
  if (priceDetected) reasons.push("가격 언급");
  if (quoteIntentDetected) reasons.push("견적 의도");
  if (exportIntentDetected) reasons.push("수출입 의도");

  return {
    quantityDetected,
    priceDetected,
    quoteIntentDetected,
    exportIntentDetected,
    score,
    hotLead,
    summary: reasons.join(", ") || "일반 문의",
  };
}