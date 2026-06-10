export type ProductInput = {
  productName?: string;
  companyName?: string;
  industry?: string;
  imageAnalysis?: string;
  pdfAnalysis?: string;
  youtubeAnalysis?: string;
  notes?: string;
};

export function normalizeProductName(input: ProductInput) {
  const raw = [
    input.productName,
    input.imageAnalysis,
    input.pdfAnalysis,
    input.notes,
  ]
    .filter(Boolean)
    .join("\n");

  if (/멀규니|멸균니|멸규니/i.test(raw)) return "멸규니";
  if (/싹쓰리충/i.test(raw)) return "싹쓰리충";
  if (/켈팍|kelpak/i.test(raw)) return "켈팍";
  if (/k[- ]?plus|케이플러스/i.test(raw)) return "K-Plus";

  return input.productName?.trim() || "제품명 미확인";
}

export function analyzeProduct(input: ProductInput) {
  const productName = normalizeProductName(input);

  return {
    productName,
    companyName: input.companyName?.trim() || "업체명 미확인",
    industry: input.industry || "unknown",
    sourceSummary: [
      input.imageAnalysis,
      input.pdfAnalysis,
      input.youtubeAnalysis,
      input.notes,
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}
