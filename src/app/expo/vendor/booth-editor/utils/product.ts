import type { ProductShape } from "../types";
import { safe } from "./format";

export function getDiscountAmount(product: ProductShape) {
  if (
    typeof product.price_krw === "number" &&
    typeof product.sale_price_krw === "number" &&
    product.price_krw > product.sale_price_krw
  ) {
    return product.price_krw - product.sale_price_krw;
  }
  return null;
}

export function getDiscountPercent(product: ProductShape) {
  if (
    typeof product.price_krw === "number" &&
    typeof product.sale_price_krw === "number" &&
    product.price_krw > product.sale_price_krw &&
    product.price_krw > 0
  ) {
    return Math.round(
      ((product.price_krw - product.sale_price_krw) / product.price_krw) * 100
    );
  }
  return null;
}

export function discountSummaryText(product: ProductShape) {
  const percent = getDiscountPercent(product);
  const amount = getDiscountAmount(product);
  if (percent === null || amount === null) return "";
  return `${percent}% 할인 · ${amount.toLocaleString("ko-KR")}원 절약`;
}

export function productPriceText(product: ProductShape) {
  if (typeof product.sale_price_krw === "number") {
    return `${product.sale_price_krw.toLocaleString("ko-KR")}원`;
  }
  if (typeof product.price_krw === "number") {
    return `${product.price_krw.toLocaleString("ko-KR")}원`;
  }
  if (safe(product.price_text, "")) return safe(product.price_text, "");
  return "가격 문의";
}

export function productOriginalPriceText(product: ProductShape) {
  if (
    typeof product.price_krw === "number" &&
    typeof product.sale_price_krw === "number" &&
    product.price_krw > product.sale_price_krw
  ) {
    return `${product.price_krw.toLocaleString("ko-KR")}원`;
  }
  return "";
}

export function imageOf(product: ProductShape) {
  return (
    safe(product.image_url, "") ||
    safe(product.image_file_url, "") ||
    safe(product.thumbnail_url, "")
  );
}

export function normalizeProducts(rows: ProductShape[]) {
  return [...(rows ?? [])]
    .filter((row) => row.is_active !== false)
    .sort((a, b) => {
      const aOrder =
        typeof a.sort_order === "number" && Number.isFinite(a.sort_order)
          ? a.sort_order
          : 9999;
      const bOrder =
        typeof b.sort_order === "number" && Number.isFinite(b.sort_order)
          ? b.sort_order
          : 9999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return safe(a.name ?? a.title, "").localeCompare(
        safe(b.name ?? b.title, ""),
        "ko"
      );
    });
}

export function productKeyOf(item: ProductShape) {
  return String(item.product_id ?? item.id ?? "");
}

export function emptyProduct(boothId: string): ProductShape {
  return {
    booth_id: boothId,
    name: "",
    title: "",
    description: "",
    image_url: "",
    image_file_url: "",
    thumbnail_url: "",
    price_krw: null,
    sale_price_krw: null,
    price_text: "",
    youtube_url: "",
    catalog_url: "",
    catalog_file_url: "",
    catalog_filename: "",
    headline_text: "",
    urgency_text: "",
    cta_text: "",
    point_1: "",
    point_2: "",
    point_3: "",
    is_active: true,
    status: "active",
    sort_order: null,
  };
}