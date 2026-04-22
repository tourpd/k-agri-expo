type Product = {
  product_id: string;
  name: string;
  category?: string;
};

type Input = {
  crop?: string;
  message?: string;
};

export function recommendProducts(
  input: Input,
  products: Product[]
) {
  const msg = (input.message || "").toLowerCase();

  let matched: Product[] = [];

  // 1. 해충
  if (
    msg.includes("총채") ||
    msg.includes("벌레") ||
    msg.includes("해충")
  ) {
    matched = products.filter(p =>
      p.name?.includes("싹쓰리충")
    );
    return {
      products: matched.slice(0, 3),
      reason: "해충 피해 의심으로 방제 제품을 우선 추천했습니다.",
    };
  }

  // 2. 병해
  if (
    msg.includes("곰팡이") ||
    msg.includes("병") ||
    msg.includes("무름")
  ) {
    matched = products.filter(p =>
      p.name?.includes("멸규니")
    );
    return {
      products: matched.slice(0, 3),
      reason: "병해 증상이 의심되어 관리 제품을 추천했습니다.",
    };
  }

  // 3. 활착 / 생육
  if (
    msg.includes("활착") ||
    msg.includes("뿌리") ||
    msg.includes("회복")
  ) {
    matched = products.filter(p =>
      p.name?.includes("켈팍")
    );
    return {
      products: matched.slice(0, 3),
      reason: "생육 회복 및 활착 개선 목적의 제품을 추천했습니다.",
    };
  }

  // 4. 기본 fallback
  return {
    products: products.slice(0, 3),
    reason: "현재 문의 기준으로 대표 제품을 우선 추천했습니다.",
  };
}