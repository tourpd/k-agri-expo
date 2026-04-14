"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

type BoothTemplate = "product" | "brand" | "deal";

type SlotItem = {
  hall_id?: string | null;
  booth_id?: string | null;
  slot_id?: string | null;
  slot_code?: string | null;

  booth_name?: string | null;
  booth_intro?: string | null;
  category?: string | null;

  detail_href?: string | null;

  x?: number | null;
  y?: number | null;
  w?: number | null;
  h?: number | null;

  logo_url?: string | null;

  product_name?: string | null;
  product_image_url?: string | null;
  product_price_text?: string | null;
  is_expo_deal?: boolean | null;

  booth_template?: BoothTemplate | null;
};

function safe(v: unknown, fallback = "") {
  const s = typeof v === "string" ? v : "";
  return s.trim() ? s.trim() : fallback;
}

function pickTemplate(slot: SlotItem): BoothTemplate {
  const explicit = safe(slot.booth_template, "");
  if (explicit === "product" || explicit === "brand" || explicit === "deal") {
    return explicit;
  }

  if (slot.is_expo_deal) return "deal";
  if (safe(slot.product_name, "")) return "product";
  return "brand";
}

function getBoardMetrics(slots: SlotItem[]) {
  const valid = (slots ?? []).filter(Boolean);
  const maxX = Math.max(...valid.map((s) => Number(s.x ?? 1)), 1);
  const maxY = Math.max(...valid.map((s) => Number(s.y ?? 1)), 1);

  const cellW = 170;
  const cellH = 132;
  const gapX = 22;
  const gapY = 30;

  const width = maxX * cellW + (maxX - 1) * gapX + 48;
  const height = maxY * cellH + (maxY - 1) * gapY + 48;

  return { cellW, cellH, gapX, gapY, width, height };
}

export default function ExpoHallMapClient({
  slots,
}: {
  slots: SlotItem[];
}) {
  const [zoom, setZoom] = useState(1);
  const [hover, setHover] = useState<SlotItem | null>(null);

  const board = useMemo(() => getBoardMetrics(slots ?? []), [slots]);

  return (
    <div style={wrap}>
      <div style={toolbar}>
        <div style={toolbarLeft}>
          <button
            type="button"
            style={toolbarBtn}
            onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.1).toFixed(1))))}
          >
            확대
          </button>
          <button
            type="button"
            style={toolbarBtn}
            onClick={() => setZoom((z) => Math.max(0.8, Number((z - 0.1).toFixed(1))))}
          >
            축소
          </button>
        </div>

        <div style={toolbarLegend}>
          <span style={legendPill}>대표상품형</span>
          <span style={legendPill}>브랜드형</span>
          <span style={legendPillHot}>특가형</span>
        </div>
      </div>

      <div style={viewport}>
        <div
          style={{
            ...boardWrap,
            width: board.width,
            height: board.height,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          }}
        >
          {(slots ?? []).map((slot, idx) => {
            const x = Number(slot.x ?? 1);
            const y = Number(slot.y ?? 1);
            const w = Number(slot.w ?? 1);
            const h = Number(slot.h ?? 1);

            const left = 24 + (x - 1) * (board.cellW + board.gapX);
            const top = 24 + (y - 1) * (board.cellH + board.gapY);
            const width = board.cellW * w + board.gapX * (w - 1);
            const height = board.cellH * h + board.gapY * (h - 1);

            const occupied = !!slot.booth_id;
            const href = slot.detail_href && occupied ? slot.detail_href : null;

            const content = (
              <div
                style={{
                  position: "absolute",
                  left,
                  top,
                  width,
                  height,
                }}
                onMouseEnter={() => setHover(slot)}
                onMouseLeave={() => setHover(null)}
              >
                <BoothIsometricCard slot={slot} occupied={occupied} />
              </div>
            );

            return href ? (
              <Link
                key={`${slot.slot_id ?? "slot"}-${idx}`}
                href={href}
                style={{ textDecoration: "none" }}
              >
                {content}
              </Link>
            ) : (
              <div key={`${slot.slot_id ?? "slot"}-${idx}`}>{content}</div>
            );
          })}
        </div>

        {hover ? <HoverPanel slot={hover} /> : null}
      </div>
    </div>
  );
}

function BoothIsometricCard({
  slot,
  occupied,
}: {
  slot: SlotItem;
  occupied: boolean;
}) {
  const template = pickTemplate(slot);
  const slotCode = safe(slot.slot_code ?? slot.slot_id, "-");
  const boothName = safe(slot.booth_name, occupied ? "부스" : "입점 가능");
  const category = safe(slot.category, occupied ? "카테고리" : "빈 슬롯");
  const intro = safe(
    slot.booth_intro,
    occupied ? "대표 정보를 준비 중입니다." : "이 위치는 입점 가능한 공간입니다."
  );

  const logoUrl = safe(slot.logo_url, "");
  const productImageUrl = safe(slot.product_image_url, "");
  const productName = safe(slot.product_name, occupied ? "대표 상품" : "");
  const priceText = safe(slot.product_price_text, "");
  const showDeal = !!slot.is_expo_deal;

  return (
    <div style={boothWrap}>
      <div style={floorShadow} />
      <div style={floorPlate} />

      <div
        style={{
          ...boothBody,
          ...(occupied ? boothBodyActive : boothBodyIdle),
          ...(template === "deal" ? boothDealTone : {}),
        }}
      >
        <div style={roofBar}>
          <div style={slotBadge}>{slotCode}</div>
          {showDeal ? <div style={dealBadge}>EXPO 특가</div> : null}
        </div>

        <div style={frontPanel}>
          <div style={brandRow}>
            <div style={logoBox}>
              {logoUrl ? (
                <img src={logoUrl} alt={boothName} style={logoImg} />
              ) : (
                <div style={logoFallback}>{boothName.slice(0, 2)}</div>
              )}
            </div>

            <div style={brandTextWrap}>
              <div style={brandName}>{boothName}</div>
              <div style={brandCategory}>{category}</div>
            </div>
          </div>

          <div style={showcaseArea}>
            {occupied ? (
              <>
                {productImageUrl ? (
                  <div style={productImageWrap}>
                    <img src={productImageUrl} alt={productName} style={productImage} />
                  </div>
                ) : (
                  <div style={productPlaceholder}>
                    {template === "brand" ? "브랜드 소개" : "대표 상품"}
                  </div>
                )}

                <div style={productTextBlock}>
                  <div style={productNameText}>
                    {template === "brand" ? intro : productName || intro}
                  </div>
                  {priceText ? <div style={priceTextStyle}>{priceText}</div> : null}
                </div>
              </>
            ) : (
              <div style={emptyStateWrap}>
                <div style={emptyStateTitle}>입점 가능</div>
                <div style={emptyStateText}>이 자리는 새 업체가 직접 꾸밀 수 있습니다.</div>
              </div>
            )}
          </div>

          <div style={frontFooter}>
            <div style={miniPill}>{occupied ? "부스 보기" : "Coming Soon"}</div>
          </div>
        </div>

        <div style={sideFace} />
      </div>
    </div>
  );
}

function HoverPanel({ slot }: { slot: SlotItem }) {
  const occupied = !!slot.booth_id;
  const boothName = safe(slot.booth_name, occupied ? "부스" : "입점 가능");
  const slotCode = safe(slot.slot_code ?? slot.slot_id, "-");
  const category = safe(slot.category, occupied ? "카테고리" : "빈 슬롯");
  const intro = safe(
    slot.booth_intro,
    occupied ? "대표 정보를 준비 중입니다." : "입점 가능한 공간입니다."
  );
  const priceText = safe(slot.product_price_text, "");
  const productName = safe(slot.product_name, "");

  return (
    <div style={hoverCard}>
      <div style={hoverTopRow}>
        <div style={hoverSlot}>{slotCode}</div>
        <div style={hoverCategory}>{category}</div>
      </div>

      <div style={hoverName}>{boothName}</div>

      {productName ? <div style={hoverProduct}>대표 상품: {productName}</div> : null}
      {priceText ? <div style={hoverPrice}>{priceText}</div> : null}

      <div style={hoverIntro}>{intro}</div>

      {slot.detail_href ? (
        <Link href={slot.detail_href} style={hoverLink}>
          부스 보기 →
        </Link>
      ) : (
        <div style={hoverEmptyLink}>입점 문의 준비 중</div>
      )}
    </div>
  );
}

const wrap: React.CSSProperties = {
  position: "relative",
  background: "#fff",
};

const toolbar: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  padding: "12px 14px",
  borderBottom: "1px solid #eee",
  background: "#fff",
};

const toolbarLeft: React.CSSProperties = {
  display: "flex",
  gap: 8,
};

const toolbarBtn: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111",
  fontWeight: 800,
  cursor: "pointer",
};

const toolbarLegend: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const legendPill: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 999,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#334155",
  fontSize: 12,
  fontWeight: 800,
};

const legendPillHot: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 999,
  background: "#fff7ed",
  border: "1px solid #fdba74",
  color: "#c2410c",
  fontSize: 12,
  fontWeight: 900,
};

const viewport: React.CSSProperties = {
  position: "relative",
  overflow: "auto",
  minHeight: 460,
  background:
    "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 45%, #e2e8f0 100%)",
};

const boardWrap: React.CSSProperties = {
  position: "relative",
  margin: 20,
};

const boothWrap: React.CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
};

const floorShadow: React.CSSProperties = {
  position: "absolute",
  left: 18,
  right: 8,
  bottom: 6,
  height: 18,
  borderRadius: 18,
  background: "rgba(15,23,42,0.18)",
  filter: "blur(8px)",
};

const floorPlate: React.CSSProperties = {
  position: "absolute",
  left: 6,
  right: 0,
  bottom: 0,
  height: 24,
  borderRadius: 14,
  background: "linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%)",
  transform: "skewX(-22deg)",
};

const boothBody: React.CSSProperties = {
  position: "absolute",
  left: 0,
  right: 12,
  top: 0,
  bottom: 18,
  borderRadius: 16,
  overflow: "hidden",
  transform: "translateY(0)",
  transition: "all 0.18s ease",
};

const boothBodyActive: React.CSSProperties = {
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  border: "1px solid #dbeafe",
  boxShadow: "0 16px 30px rgba(15,23,42,0.12)",
};

const boothBodyIdle: React.CSSProperties = {
  background: "linear-gradient(180deg, #f3f4f6 0%, #e5e7eb 100%)",
  border: "1px solid #d1d5db",
  boxShadow: "0 12px 20px rgba(15,23,42,0.08)",
};

const boothDealTone: React.CSSProperties = {
  border: "1px solid #fdba74",
  background: "linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%)",
};

const roofBar: React.CSSProperties = {
  height: 28,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0 10px",
  background: "linear-gradient(90deg, #0f172a 0%, #1e293b 100%)",
};

const slotBadge: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 900,
  color: "#fff",
  letterSpacing: 0.2,
};

const dealBadge: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: 999,
  background: "#f97316",
  color: "#fff",
  fontSize: 10,
  fontWeight: 900,
};

const frontPanel: React.CSSProperties = {
  position: "absolute",
  inset: "28px 0 0 0",
  display: "flex",
  flexDirection: "column",
  padding: 10,
};

const brandRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
};

const logoBox: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 10,
  background: "#fff",
  border: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  flexShrink: 0,
};

const logoImg: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
  display: "block",
};

const logoFallback: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 900,
  color: "#0f172a",
};

const brandTextWrap: React.CSSProperties = {
  minWidth: 0,
  flex: 1,
};

const brandName: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 900,
  color: "#0f172a",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const brandCategory: React.CSSProperties = {
  marginTop: 2,
  fontSize: 11,
  color: "#64748b",
  fontWeight: 700,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const showcaseArea: React.CSSProperties = {
  marginTop: 10,
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const productImageWrap: React.CSSProperties = {
  flex: 1,
  minHeight: 46,
  borderRadius: 12,
  overflow: "hidden",
  background: "#fff",
  border: "1px solid #e5e7eb",
};

const productImage: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const productPlaceholder: React.CSSProperties = {
  flex: 1,
  minHeight: 46,
  borderRadius: 12,
  background: "linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)",
  border: "1px dashed #94a3b8",
  color: "#334155",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 800,
};

const productTextBlock: React.CSSProperties = {
  minHeight: 34,
};

const productNameText: React.CSSProperties = {
  fontSize: 11,
  lineHeight: 1.4,
  color: "#334155",
  fontWeight: 700,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const priceTextStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  fontWeight: 900,
  color: "#dc2626",
};

const emptyStateWrap: React.CSSProperties = {
  flex: 1,
  borderRadius: 12,
  background: "rgba(255,255,255,0.55)",
  border: "1px dashed #cbd5e1",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 10,
  textAlign: "center",
};

const emptyStateTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 900,
  color: "#334155",
};

const emptyStateText: React.CSSProperties = {
  marginTop: 6,
  fontSize: 11,
  color: "#64748b",
  lineHeight: 1.5,
};

const frontFooter: React.CSSProperties = {
  marginTop: 6,
  display: "flex",
  justifyContent: "flex-end",
};

const miniPill: React.CSSProperties = {
  padding: "5px 8px",
  borderRadius: 999,
  background: "#111827",
  color: "#fff",
  fontSize: 10,
  fontWeight: 900,
};

const sideFace: React.CSSProperties = {
  position: "absolute",
  top: 28,
  right: -10,
  bottom: 18,
  width: 12,
  background: "linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%)",
  transform: "skewY(-28deg)",
  transformOrigin: "top",
  borderTopRightRadius: 8,
  borderBottomRightRadius: 8,
};

const hoverCard: React.CSSProperties = {
  position: "absolute",
  top: 14,
  right: 14,
  width: 280,
  padding: 14,
  borderRadius: 14,
  background: "#fff",
  border: "1px solid #e5e7eb",
  boxShadow: "0 12px 30px rgba(15,23,42,0.12)",
  zIndex: 20,
};

const hoverTopRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
};

const hoverSlot: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  color: "#16a34a",
};

const hoverCategory: React.CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 700,
};

const hoverName: React.CSSProperties = {
  marginTop: 8,
  fontSize: 18,
  fontWeight: 900,
  color: "#0f172a",
  lineHeight: 1.3,
};

const hoverProduct: React.CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  fontWeight: 800,
  color: "#334155",
};

const hoverPrice: React.CSSProperties = {
  marginTop: 6,
  fontSize: 14,
  fontWeight: 900,
  color: "#dc2626",
};

const hoverIntro: React.CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  lineHeight: 1.7,
  color: "#475569",
};

const hoverLink: React.CSSProperties = {
  display: "inline-block",
  marginTop: 12,
  fontSize: 13,
  fontWeight: 900,
  color: "#111827",
  textDecoration: "none",
};

const hoverEmptyLink: React.CSSProperties = {
  marginTop: 12,
  fontSize: 13,
  fontWeight: 800,
  color: "#94a3b8",
};