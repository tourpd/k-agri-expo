export function safe(v: unknown, fallback = "") {
  const s = typeof v === "string" ? v : "";
  return s.trim() ? s.trim() : fallback;
}

export function formatCurrency(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return `${value.toLocaleString("ko-KR")}원`;
}

export function formatCurrencyInput(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return `${value.toLocaleString("ko-KR")}원`;
}

export function toNullableNumber(v: string) {
  const digits = (v || "").replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}