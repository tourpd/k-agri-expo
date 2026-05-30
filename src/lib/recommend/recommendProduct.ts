type Product = {
  product_id: string;
  name: string;
  title?: string;
  tags?: string;
};

type Input = {
  crop?: string;
  message?: string;
};

function normalize(text: string) {
  return text.toLowerCase().replace(/\s/g, "");
}

function scoreProduct(product: Product, message: string) {
  if (!product.tags) return 0;

  const msg = normalize(message);
  const tags = product.tags.split(",").map(t => normalize(t));

  let score = 0;

  for (const tag of tags) {
    if (msg.includes(tag)) {
      score += 10;
    }
  }

  return score;
}

export function recommendProducts(
  input: Input,
  products: Product[]
) {
  const message = input.message || "";

  // 🔥 1. 태그 기반 점수 계산
  const scored = products.map(p => ({
    product: p,
    score: scoreProduct(p, message),
  }));

  // 🔥 2. 점수 높은 순 정렬
  const sorted = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (sorted.length > 0) {
    return {
      products: sorted.slice(0, 3).map(s => s.product),
      reason: "진단 결과 기반으로 가장 적합한 제품을 추천했습니다.",
    };
  }

  // 🔥 3. fallback (기존 로직)
  if (message.includes("해충") || message.includes("벌레")) {
    const matched = products.filter(p =>
      p.name?.includes("싹쓰리충")
    );
    return {
      products: matched.slice(0, 3),
      reason: "해충 피해 의심으로 방제 제품을 추천했습니다.",
    };
  }

  if (message.includes("병") || message.includes("곰팡이")) {
    const matched = products.filter(p =>
      p.name?.includes("멸규니")
    );
    return {
      products: matched.slice(0, 3),
      reason: "병해 관리 제품을 추천했습니다.",
    };
  }

  if (message.includes("활착") || message.includes("뿌리")) {
    const matched = products.filter(p =>
      p.name?.includes("켈팍")
    );
    return {
      products: matched.slice(0, 3),
      reason: "생육 개선 제품을 추천했습니다.",
    };
  }

  // 🔥 4. 최종 fallback
  return {
    products: products.slice(0, 3),
    reason: "대표 제품을 우선 추천했습니다.",
  };
}