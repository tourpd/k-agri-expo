export function predictCrmTags({
  industry,
  productName,
}: {
  industry: string;
  productName: string;
}) {
  const base = [`상품_${productName}`, `산업_${industry}`];

  if (industry === "health") {
    return [...base, "건강관심", "부모님선물", "재구매가능", "중장년고객"];
  }

  if (industry === "machinery") {
    return [...base, "농기계관심", "보조사업관심", "A/S상담", "대면적농가"];
  }

  return [...base, "농자재관심", "공동구매대상", "라이브방송대상", "재구매가능"];
}
