export type Product = {
  id: string;
  category: string;
  name: string;
  width_mm: number;
  depth_mm: number;
  height_mm: number;
  price_krw: number;
  install_labor_krw: number;
  source_status: string;
  note?: string;
};

export type VehicleSpace = {
  inside_length_mm: number;
  inside_width_mm: number;
  inside_height_mm: number;
};

export function calcProductTotal(products: Product[]) {
  const productTotal = products.reduce((sum, p) => sum + (p.price_krw || 0), 0);
  const laborTotal = products.reduce((sum, p) => sum + (p.install_labor_krw || 0), 0);
  return {
    product_total_krw: productTotal,
    install_labor_total_krw: laborTotal,
    total_krw: productTotal + laborTotal
  };
}

export function simpleFitCheck(space: VehicleSpace, products: Product[]) {
  const issues: string[] = [];

  for (const p of products) {
    if (p.depth_mm > space.inside_length_mm) {
      issues.push(`${p.name}: 길이 ${p.depth_mm}mm가 실내 길이 ${space.inside_length_mm}mm 초과`);
    }
    if (p.width_mm > space.inside_width_mm) {
      issues.push(`${p.name}: 폭 ${p.width_mm}mm가 실내 폭 ${space.inside_width_mm}mm 초과`);
    }
    if (p.height_mm > space.inside_height_mm) {
      issues.push(`${p.name}: 높이 ${p.height_mm}mm가 실내 높이 ${space.inside_height_mm}mm 초과`);
    }
  }

  return {
    fit_status: issues.length ? "확인필요" : "개별 제품 크기 기준 가능",
    issues
  };
}
