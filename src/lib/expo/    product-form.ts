import {
  createEmptyProductSpec,
  type ProductSpecShape,
} from "@/types/expo-product-spec";

type ProductShape = {
  id?: string | number;
  product_id?: string | number;
  booth_id?: string;

  name?: string;
  title?: string;
  description?: string;

  image_url?: string;
  image_file_url?: string;
  thumbnail_url?: string;

  price_krw?: number | null;
  sale_price_krw?: number | null;
  price_text?: string;

  youtube_url?: string;

  catalog_url?: string;
  catalog_file_url?: string;
  catalog_filename?: string;

  headline_text?: string;
  urgency_text?: string;
  cta_text?: string;

  point_1?: string;
  point_2?: string;
  point_3?: string;

  purchase_url?: string;
  dealer_apply_url?: string;
  buyer_apply_url?: string;

  usage_summary?: string;
  usage_method?: string;
  usage_timing?: string;
  usage_interval?: string;
  usage_crops?: string;
  caution_text?: string;

  calc_base_water_liter?: number | null;
  calc_base_product_ml?: number | null;
  calc_base_area_pyeong?: number | null;

  is_active?: boolean;
  status?: string;
  sort_order?: number | null;

  spec?: ProductSpecShape;
};

export function safeText(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

export function trimmed(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

export function boolOn(v: boolean | undefined, defaultValue = true): boolean {
  return typeof v === "boolean" ? v : defaultValue;
}

export function toNullableNumber(v: string): number | null {
  const digits = (v || "").replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

export function formatMoney(v?: number | null): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "";
  return `${v.toLocaleString("ko-KR")}원`;
}

export function discountPercent(product: ProductShape): number | null {
  if (
    typeof product.price_krw === "number" &&
    typeof product.sale_price_krw === "number" &&
    product.price_krw > 0 &&
    product.sale_price_krw < product.price_krw
  ) {
    return Math.round(
      ((product.price_krw - product.sale_price_krw) / product.price_krw) * 100
    );
  }
  return null;
}

export function normalizeHallId(v?: string): string {
  const hall = trimmed(v, "");
  if (!hall) return "";
  if (hall === "agri_inputs") return "agri-inputs";
  if (hall === "smart_farm") return "smartfarm";
  if (hall === "eco_friendly") return "eco-friendly";
  if (hall === "future_insect") return "future-insect";
  return hall;
}

export function normalizeSlotCode(v?: string): string {
  const slot = trimmed(v, "");
  if (!slot) return "-";
  const raw = slot.toUpperCase().replace(/\s+/g, "");
  const m = raw.match(/^([A-Z])[-_]?0*([0-9]+)$/);
  if (!m) return raw;
  return `${m[1]}-${m[2].padStart(2, "0")}`;
}

export function hallLabel(v?: string): string {
  const hall = normalizeHallId(v);
  if (!hall) return "-";
  if (hall === "agri-inputs") return "농자재관";
  if (hall === "machines" || hall === "agri-machinery") return "농기계관";
  if (hall === "seeds") return "종자관";
  if (hall === "smartfarm") return "스마트팜관";
  if (hall === "eco-friendly" || hall === "eco") return "친환경관";
  if (hall === "future-insect" || hall === "future-food") return "미래식량관";
  return hall;
}

export function normalizeSpec(spec?: ProductSpecShape | null): ProductSpecShape {
  return {
    ...createEmptyProductSpec(),
    ...(spec ?? {}),
  };
}

export function createEmptyProduct(boothId = ""): ProductShape {
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
    cta_text: "지금 구매하기",

    point_1: "",
    point_2: "",
    point_3: "",

    purchase_url: "",
    dealer_apply_url: "",
    buyer_apply_url: "",

    usage_summary: "",
    usage_method: "",
    usage_timing: "",
    usage_interval: "",
    usage_crops: "",
    caution_text: "",

    calc_base_water_liter: null,
    calc_base_product_ml: null,
    calc_base_area_pyeong: null,

    is_active: true,
    status: "active",
    sort_order: null,

    spec: createEmptyProductSpec(),
  };
}

export function normalizeProduct(item: ProductShape): ProductShape {
  return {
    ...createEmptyProduct(trimmed(item.booth_id, "")),
    ...item,
    spec: normalizeSpec(item.spec),
  };
}

export function normalizeProducts(rows: ProductShape[]): ProductShape[] {
  return [...(rows ?? [])]
    .map((row) => normalizeProduct(row))
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
      return aOrder - bOrder;
    });
}

export function productKeyOf(item: ProductShape): string {
  return String(item.product_id ?? item.id ?? "");
}

export function productDisplayName(item: ProductShape): string {
  return trimmed(item.name, "") || trimmed(item.title, "") || "제품명 없음";
}

export function syncSpecFromMainForm(product: ProductShape): ProductSpecShape {
  const base = normalizeSpec(product.spec);

  return {
    ...base,
    dilution_ratio_text:
      trimmed(base.dilution_ratio_text, "") ||
      trimmed(product.usage_summary, ""),
    base_water_liter:
      typeof base.base_water_liter === "number"
        ? base.base_water_liter
        : typeof product.calc_base_water_liter === "number"
        ? product.calc_base_water_liter
        : null,
    base_product_amount:
      typeof base.base_product_amount === "number"
        ? base.base_product_amount
        : typeof product.calc_base_product_ml === "number"
        ? product.calc_base_product_ml
        : null,
    base_area_pyeong:
      typeof base.base_area_pyeong === "number"
        ? base.base_area_pyeong
        : typeof product.calc_base_area_pyeong === "number"
        ? product.calc_base_area_pyeong
        : null,
    best_timing_text:
      trimmed(base.best_timing_text, "") || trimmed(product.usage_timing, ""),
    interval_days:
      typeof base.interval_days === "number"
        ? base.interval_days
        : (() => {
            const raw = trimmed(product.usage_interval, "");
            const m = raw.match(/\d+/);
            return m ? Number(m[0]) : null;
          })(),
    target_crops:
      base.target_crops && base.target_crops.length > 0
        ? base.target_crops
        : trimmed(product.usage_crops, "")
            .split(/[,\s/]+/)
            .map((v) => v.trim())
            .filter(Boolean),
    precautions:
      trimmed(base.precautions, "") || trimmed(product.caution_text, ""),
    ai_enabled: typeof base.ai_enabled === "boolean" ? base.ai_enabled : false,
    verified_status: trimmed(base.verified_status, "draft") || "draft",
  };
}