/**
 * 살포량 계산 — "600평이면 몇 병, 물 몇 통, 한 통에 몇 ml"
 *
 * 카탈로그 숫자를 그대로 평수에 곱할 뿐입니다. 숫자를 바꾸거나 보정하지 않습니다.
 * 희석배수만 있는 제품은 '물 500L/300평'(잎이 젖을 정도, 농진청 관행 살포량)을 기본 물량으로 두고 그 가정을 화면에 적습니다.
 */
import type { DoseRule, PartnerProduct } from "./partner-catalog";

export const PYEONG_PER_10A = 300; // 10a(1,000㎡) ≈ 302.5평 → 관행대로 300평
export const DEFAULT_WATER_L_PER_300P = 500; // 엽면 살포 기본 물량(300평당 L)
export const DEFAULT_TANK_L = 20; // 1말

export type DoseResult = {
  rule: DoseRule;
  /** 한 줄 요약 */
  headline: string;
  /** 제품 필요량 (ml 또는 g) */
  productAmount: number | null;
  productUnit: "ml" | "g" | null;
  /** 물 필요량 L */
  waterL: number | null;
  /** 20L 통 수 */
  tanks: number | null;
  /** 한 통(tankL)에 넣는 양 */
  perTank: number | null;
  /** 포장별 몇 개 */
  packages: Array<{ label: string; count: number; leftover: string }>;
  assumptions: string[];
  note?: string;
};

function r(n: number, d = 0) {
  const m = Math.pow(10, d);
  return Math.round(n * m) / m;
}

function fmt(n: number, unit: string) {
  if (unit === "ml" && n >= 1000) return `${r(n / 1000, 2)}L`;
  if (unit === "g" && n >= 1000) return `${r(n / 1000, 2)}kg`;
  return `${r(n, n < 10 ? 1 : 0)}${unit}`;
}

function packagesFor(product: PartnerProduct, amount: number, unit: "ml" | "g") {
  return product.packages
    .map((pk) => {
      const size = unit === "ml" ? pk.ml : pk.g;
      if (!size) return null;
      const count = Math.max(1, Math.ceil(amount / size));
      const leftover = count * size - amount;
      return { label: pk.label, count, leftover: leftover > 0 ? `${fmt(leftover, unit)} 남음` : "딱 맞음" };
    })
    .filter(Boolean) as Array<DoseResult["packages"][number] & { count: number }>;
}

/** 남는 양이 가장 적은 포장(같으면 개수가 적은 쪽)을 앞에 */
function sortPackages(product: PartnerProduct, pk: DoseResult["packages"], amount: number, unit: "ml" | "g") {
  const size = (label: string) => {
    const f = product.packages.find((x) => x.label === label);
    return (unit === "ml" ? f?.ml : f?.g) ?? 0;
  };
  return [...pk].sort((a, b) => a.count * size(a.label) - b.count * size(b.label) || a.count - b.count);
}

export function calcDose(product: PartnerProduct, rule: DoseRule, areaPyeong: number, tankL = DEFAULT_TANK_L): DoseResult {
  const assumptions: string[] = [];
  if (rule.kind === "text") {
    return {
      rule,
      headline: rule.text,
      productAmount: null,
      productUnit: null,
      waterL: null,
      tanks: null,
      perTank: null,
      packages: [],
      assumptions,
    };
  }

  if (rule.kind === "perArea") {
    const k = areaPyeong / rule.areaPyeong;
    const isLiquid = rule.unit === "ml" || rule.unit === "L";
    const unit: "ml" | "g" = isLiquid ? "ml" : "g";
    const amount = rule.amount * (rule.unit === "L" || rule.unit === "kg" ? 1000 : 1) * k;
    const waterL = rule.waterL ? rule.waterL * k : null;
    const tanks = waterL ? Math.ceil(waterL / tankL) : null;
    const perTank = waterL && tanks ? amount / (waterL / tankL) : null;
    const headline = waterL
      ? `${areaPyeong.toLocaleString()}평 → ${fmt(amount, unit)} (물 ${r(waterL)}L, ${tankL}L 통 ${tanks}통 · 한 통에 ${fmt(perTank!, unit)})`
      : `${areaPyeong.toLocaleString()}평 → ${fmt(amount, unit)} ${rule.method === "토양" ? "토양 살포" : rule.method}`;
    return {
      rule,
      headline,
      productAmount: amount,
      productUnit: unit,
      waterL,
      tanks,
      perTank,
      packages: sortPackages(product, packagesFor(product, amount, unit), amount, unit),
      assumptions,
      note: rule.note,
    };
  }

  // dilution
  const waterL = (areaPyeong / PYEONG_PER_10A) * DEFAULT_WATER_L_PER_300P;
  assumptions.push(`물량은 300평에 ${DEFAULT_WATER_L_PER_300P}L(잎이 젖을 정도) 기준입니다. 작물 크기·시기에 따라 달라집니다.`);
  const isPowder = product.packages.some((p) => p.g) && !product.packages.some((p) => p.ml);
  const unit: "ml" | "g" = isPowder ? "g" : "ml";
  const perTank = (tankL * 1000) / rule.ratio; // 진한 쪽(ratio) 기준
  const perTankMax = rule.ratioMax ? (tankL * 1000) / rule.ratioMax : null;
  const amount = (waterL * 1000) / rule.ratio;
  const tanks = Math.ceil(waterL / tankL);
  const ratioText = rule.ratioMax ? `${rule.ratio.toLocaleString()}~${rule.ratioMax.toLocaleString()}배` : `${rule.ratio.toLocaleString()}배`;
  const perTankText = perTankMax ? `${fmt(perTankMax, unit)}~${fmt(perTank, unit)}` : fmt(perTank, unit);
  return {
    rule,
    headline: `${ratioText}: ${tankL}L 한 통에 ${perTankText} · ${areaPyeong.toLocaleString()}평이면 물 약 ${r(waterL)}L(${tanks}통), 제품 약 ${fmt(amount, unit)}`,
    productAmount: amount,
    productUnit: unit,
    waterL,
    tanks,
    perTank,
    packages: sortPackages(product, packagesFor(product, amount, unit), amount, unit),
    assumptions,
    note: rule.note,
  };
}

/** 평 ↔ 다른 단위 */
export function toPyeong(value: number, unit: "평" | "a" | "ha" | "㎡" | "마지기") {
  switch (unit) {
    case "평":
      return value;
    case "㎡":
      return value / 3.3058;
    case "a":
      return value * 30.25;
    case "ha":
      return value * 3025;
    case "마지기":
      return value * 200; // 지역마다 150~300평. 200평 기준
  }
}
