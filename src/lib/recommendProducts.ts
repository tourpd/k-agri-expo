export function matchRecommendedProducts(products: any[], diagnosisText: string) {
  const diagnosis = String(diagnosisText || "").toLowerCase();

  if (!diagnosis) return [];

  return products.filter((product) => {
    const tags = String(product.tags || "")
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);

    if (tags.length === 0) return false;

    return tags.some((tag) => diagnosis.includes(tag));
  });
}