import { PRODUCT_MAP } from "../rules/product-map";

export function matchProduct(cause: string) {
  return PRODUCT_MAP[cause] || "기본방제제품";
}
