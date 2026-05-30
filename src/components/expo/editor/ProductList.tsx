"use client";

import React from "react";

type ProductShape = {
  id?: string | number;
  product_id?: string | number;
  booth_id?: string;

  name?: string;
  title?: string;
  description?: string;

  price_krw?: number | null;
  sale_price_krw?: number | null;
  price_text?: string;

  purchase_url?: string;

  image_url?: string;
  image_file_url?: string;
  thumbnail_url?: string;

  catalog_url?: string;
  catalog_file_url?: string;
  catalog_filename?: string;

  youtube_url?: string;

  headline_text?: string;
  urgency_text?: string;
  cta_text?: string;

  point_1?: string;
  point_2?: string;
  point_3?: string;

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
};

type Props = {
  items: ProductShape[];
  onEdit: (item: ProductShape) => void;
  onDelete: (id: string | number) => void;
  deletingKey?: string;
};

function getProductKey(item: ProductShape) {
  const raw = item.product_id ?? item.id ?? "";
  return String(raw);
}

function displayName(item: ProductShape) {
  return (
    String(item.name ?? "").trim() ||
    String(item.title ?? "").trim() ||
    "제품명 없음"
  );
}

function displayHeadline(item: ProductShape) {
  return (
    String(item.headline_text ?? "").trim() ||
    String(item.title ?? "").trim() ||
    String(item.description ?? "").trim() ||
    "이 제품의 핵심 메시지가 아직 입력되지 않았습니다."
  );
}

function displaySummary(item: ProductShape) {
  return (
    String(item.usage_summary ?? "").trim() ||
    buildDoseLine(item) ||
    String(item.description ?? "").trim() ||
    "사용 요약 정보가 없습니다."
  );
}

function displayCrops(item: ProductShape) {
  const raw = String(item.usage_crops ?? "").trim();
  return raw || "적용 작물 미입력";
}

function displayTiming(item: ProductShape) {
  const raw = String(item.usage_timing ?? "").trim();
  return raw || "사용 시기 미입력";
}

function displayUrgency(item: ProductShape) {
  return String(item.urgency_text ?? "").trim();
}

function buildDoseLine(item: ProductShape) {
  const water = item.calc_base_water_liter;
  const product = item.calc_base_product_ml;
  const area = item.calc_base_area_pyeong;

  if (
    typeof water === "number" &&
    Number.isFinite(water) &&
    typeof product === "number" &&
    Number.isFinite(product)
  ) {
    const areaText =
      typeof area === "number" && Number.isFinite(area)
        ? ` / ${area}평 기준`
        : "";
    return `물 ${water}L당 제품 ${product}ml${areaText}`;
  }

  return "";
}

function formatMoney(v?: number | null) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "";
  return `${v.toLocaleString("ko-KR")}원`;
}

function getDiscountPercent(item: ProductShape) {
  if (
    typeof item.price_krw === "number" &&
    typeof item.sale_price_krw === "number" &&
    item.price_krw > 0 &&
    item.sale_price_krw < item.price_krw
  ) {
    return Math.round(
      ((item.price_krw - item.sale_price_krw) / item.price_krw) * 100
    );
  }
  return null;
}

function getThumb(item: ProductShape) {
  return (
    String(item.image_url ?? "").trim() ||
    String(item.image_file_url ?? "").trim() ||
    String(item.thumbnail_url ?? "").trim() ||
    ""
  );
}

function hasCalculatorBasis(item: ProductShape) {
  return (
    typeof item.calc_base_water_liter === "number" &&
    Number.isFinite(item.calc_base_water_liter) &&
    typeof item.calc_base_product_ml === "number" &&
    Number.isFinite(item.calc_base_product_ml)
  );
}

function getDisplayPrice(item: ProductShape) {
  return (
    formatMoney(item.sale_price_krw) ||
    item.price_text ||
    formatMoney(item.price_krw) ||
    "가격 문의"
  );
}

export default function ProductList({
  items,
  onEdit,
  onDelete,
  deletingKey = "",
}: Props) {
  return (
    <section style={S.card}>
      <div style={S.headerRow}>
        <div>
          <h2 style={S.title}>등록된 제품 목록</h2>
          <div style={S.subTitle}>
            제품을 단순 목록이 아니라 판매 전환형 카드로 확인합니다.
          </div>
        </div>

        <div style={S.countBadge}>{items.length}개</div>
      </div>

      {items.length === 0 ? (
        <div style={S.emptyBox}>아직 등록된 제품이 없습니다.</div>
      ) : (
        <div style={S.list}>
          {items.map((item, idx) => {
            const key = getProductKey(item) || String(idx);
            const deleting = deletingKey === key;
            const thumb = getThumb(item);
            const publicLink = item.product_id
              ? `/expo/product/${item.product_id}`
              : null;
            const discount = getDiscountPercent(item);
            const doseLine = buildDoseLine(item);
            const urgency = displayUrgency(item);

            return (
              <div key={key} style={S.itemCard}>
                <div style={S.itemTop}>
                  <div style={S.thumbWrap}>
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={displayName(item)}
                        style={S.thumb}
                      />
                    ) : (
                      <div style={S.noThumb}>이미지 없음</div>
                    )}
                  </div>

                  <div style={S.itemBody}>
                    <div style={S.badgeRow}>
                      {urgency ? (
                        <span style={S.urgencyBadge}>{urgency}</span>
                      ) : null}

                      {discount !== null ? (
                        <span style={S.discountBadge}>{discount}% 할인</span>
                      ) : null}

                      {hasCalculatorBasis(item) ? (
                        <span style={S.calcBadge}>면적 계산 가능</span>
                      ) : null}
                    </div>

                    <div style={S.itemName}>{displayName(item)}</div>

                    <div style={S.headline}>{displayHeadline(item)}</div>

                    <div style={S.infoGrid}>
                      <div style={S.infoBox}>
                        <div style={S.infoLabel}>적용 작물</div>
                        <div style={S.infoValue}>{displayCrops(item)}</div>
                      </div>

                      <div style={S.infoBox}>
                        <div style={S.infoLabel}>사용 시기</div>
                        <div style={S.infoValue}>{displayTiming(item)}</div>
                      </div>
                    </div>

                    <div style={S.summaryBox}>
                      <div style={S.summaryTitle}>핵심 사용 기준</div>
                      <div style={S.summaryText}>{displaySummary(item)}</div>
                      {doseLine ? <div style={S.doseLine}>{doseLine}</div> : null}
                    </div>

                    <div style={S.priceRow}>
                      <div style={S.salePrice}>{getDisplayPrice(item)}</div>

                      {typeof item.price_krw === "number" &&
                      typeof item.sale_price_krw === "number" &&
                      item.sale_price_krw < item.price_krw ? (
                        <div style={S.originPrice}>
                          {formatMoney(item.price_krw)}
                        </div>
                      ) : null}
                    </div>

                    <div style={S.metaRow}>
                      {item.purchase_url ? (
                        <span style={S.metaBadge}>구매링크 있음</span>
                      ) : (
                        <span style={S.metaBadgeMuted}>구매링크 없음</span>
                      )}

                      {item.catalog_file_url ? (
                        <span style={S.metaBadge}>카탈로그 있음</span>
                      ) : null}

                      {item.youtube_url ? (
                        <span style={S.metaBadge}>영상 있음</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div style={S.actionRow}>
                  {publicLink ? (
                    <a
                      href={publicLink}
                      target="_blank"
                      rel="noreferrer"
                      style={S.previewBtn}
                    >
                      미리보기
                    </a>
                  ) : null}

                  {publicLink ? (
                    <a
                      href={publicLink}
                      target="_blank"
                      rel="noreferrer"
                      style={S.calcBtn}
                    >
                      내 밭 기준 보기
                    </a>
                  ) : null}

                  {item.purchase_url ? (
                    <a
                      href={item.purchase_url}
                      target="_blank"
                      rel="noreferrer"
                      style={S.buyBtn}
                    >
                      {String(item.cta_text ?? "").trim() || "바로 구매"}
                    </a>
                  ) : null}

                  <button
                    type="button"
                    style={S.editBtn}
                    onClick={() => onEdit(item)}
                  >
                    수정
                  </button>

                  <button
                    type="button"
                    style={deleting ? S.deleteBtnDisabled : S.deleteBtn}
                    disabled={deleting}
                    onClick={() => {
                      const id = item.product_id ?? item.id;
                      if (id === undefined || id === null) return;

                      const ok = window.confirm(
                        `"${displayName(item)}" 제품을 삭제하시겠습니까?`
                      );
                      if (!ok) return;

                      onDelete(id);
                    }}
                  >
                    {deleting ? "삭제 중..." : "삭제"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    border: "1px solid #e5e7eb",
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
    flexWrap: "wrap",
  },

  title: {
    fontSize: 22,
    fontWeight: 900,
    margin: 0,
    color: "#111827",
  },

  subTitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.6,
  },

  countBadge: {
    height: 34,
    padding: "0 12px",
    borderRadius: 999,
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
    display: "inline-flex",
    alignItems: "center",
    fontSize: 13,
    fontWeight: 800,
    color: "#374151",
  },

  emptyBox: {
    padding: 18,
    borderRadius: 12,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    color: "#64748b",
    fontSize: 14,
  },

  list: {
    display: "grid",
    gap: 14,
  },

  itemCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
    background: "#fff",
  },

  itemTop: {
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },

  thumbWrap: {
    width: 130,
    minWidth: 130,
  },

  thumb: {
    width: 130,
    height: 130,
    borderRadius: 14,
    objectFit: "cover",
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    display: "block",
  },

  noThumb: {
    width: 130,
    height: 130,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    textAlign: "center",
    padding: 8,
  },

  itemBody: {
    flex: 1,
    minWidth: 260,
  },

  badgeRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 8,
  },

  urgencyBadge: {
    height: 28,
    padding: "0 10px",
    borderRadius: 999,
    background: "#fff7ed",
    border: "1px solid #fdba74",
    color: "#c2410c",
    display: "inline-flex",
    alignItems: "center",
    fontSize: 12,
    fontWeight: 800,
  },

  discountBadge: {
    height: 28,
    padding: "0 10px",
    borderRadius: 999,
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    color: "#b91c1c",
    display: "inline-flex",
    alignItems: "center",
    fontSize: 12,
    fontWeight: 800,
  },

  calcBadge: {
    height: 28,
    padding: "0 10px",
    borderRadius: 999,
    background: "#eff6ff",
    border: "1px solid #93c5fd",
    color: "#1d4ed8",
    display: "inline-flex",
    alignItems: "center",
    fontSize: 12,
    fontWeight: 800,
  },

  itemName: {
    fontSize: 20,
    fontWeight: 900,
    color: "#111827",
    lineHeight: 1.4,
  },

  headline: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: 700,
    color: "#1f2937",
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
    wordBreak: "keep-all",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginTop: 12,
  },

  infoBox: {
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    borderRadius: 12,
    padding: 12,
  },

  infoLabel: {
    fontSize: 12,
    fontWeight: 800,
    color: "#64748b",
    marginBottom: 6,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: 800,
    color: "#111827",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    wordBreak: "keep-all",
  },

  summaryBox: {
    marginTop: 12,
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    borderRadius: 12,
    padding: 12,
  },

  summaryTitle: {
    fontSize: 12,
    fontWeight: 900,
    color: "#1d4ed8",
    marginBottom: 6,
  },

  summaryText: {
    fontSize: 14,
    lineHeight: 1.8,
    color: "#1e3a8a",
    fontWeight: 700,
    whiteSpace: "pre-wrap",
    wordBreak: "keep-all",
  },

  doseLine: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 1.7,
    color: "#1d4ed8",
    fontWeight: 900,
  },

  priceRow: {
    marginTop: 14,
    display: "flex",
    gap: 10,
    alignItems: "baseline",
    flexWrap: "wrap",
  },

  salePrice: {
    fontSize: 28,
    fontWeight: 900,
    color: "#dc2626",
    lineHeight: 1.2,
  },

  originPrice: {
    fontSize: 13,
    fontWeight: 800,
    color: "#94a3b8",
    textDecoration: "line-through",
  },

  metaRow: {
    marginTop: 10,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  metaBadge: {
    height: 28,
    padding: "0 10px",
    borderRadius: 999,
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#166534",
    display: "inline-flex",
    alignItems: "center",
    fontSize: 12,
    fontWeight: 800,
  },

  metaBadgeMuted: {
    height: 28,
    padding: "0 10px",
    borderRadius: 999,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    color: "#64748b",
    display: "inline-flex",
    alignItems: "center",
    fontSize: 12,
    fontWeight: 800,
  },

  actionRow: {
    marginTop: 16,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  previewBtn: {
    height: 42,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#111827",
    fontWeight: 900,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },

  calcBtn: {
    height: 42,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid #93c5fd",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: 900,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },

  buyBtn: {
    height: 42,
    padding: "0 16px",
    borderRadius: 12,
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontWeight: 900,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },

  editBtn: {
    height: 42,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#111827",
    fontWeight: 900,
    cursor: "pointer",
  },

  deleteBtn: {
    height: 42,
    padding: "0 14px",
    borderRadius: 12,
    border: "none",
    background: "#dc2626",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },

  deleteBtnDisabled: {
    height: 42,
    padding: "0 14px",
    borderRadius: 12,
    border: "none",
    background: "#fca5a5",
    color: "#fff",
    fontWeight: 900,
    cursor: "not-allowed",
  },
};