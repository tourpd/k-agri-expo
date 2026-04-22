"use client";

import React from "react";

type BoothProductCardProps = {
  name: string;
  description?: string;
  priceText?: string;
  imageUrl?: string;
  inquiryHref?: string;
  catalogHref?: string;

  hookText?: string;
  urgencyText?: string;
  ctaText?: string;
  points?: string[];

  youtubeUrl?: string;
  eventBadge?: string;
  stockText?: string;
  originalPriceText?: string;
};

function safe(v: unknown, fallback = "") {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function isYoutubeUrl(url?: string) {
  const v = safe(url, "").toLowerCase();
  return v.includes("youtube.com") || v.includes("youtu.be");
}

const RESPONSIVE_CSS = `
.booth-product-card * {
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .booth-product-card-top {
    flex-direction: column !important;
    align-items: flex-start !important;
  }

  .booth-product-card-pricebox {
    align-items: flex-start !important;
    width: 100% !important;
  }

  .booth-product-card-actions {
    grid-template-columns: 1fr !important;
  }

  .booth-product-card-mainbtn,
  .booth-product-card-subbtn,
  .booth-product-card-videobtn {
    width: 100% !important;
  }
}
`;

export default function BoothProductCard({
  name,
  description = "",
  priceText = "가격 문의",
  imageUrl = "",
  inquiryHref = "#inquiry-request",
  catalogHref = "",
  hookText = "",
  urgencyText = "",
  ctaText = "",
  points = [],
  youtubeUrl = "",
  eventBadge = "공동특가",
  stockText = "",
  originalPriceText = "",
}: BoothProductCardProps) {
  const resolvedName = safe(name, "제품명 없음");
  const resolvedBody = safe(description, "");
  const resolvedHook = safe(hookText, "");
  const resolvedUrgency = safe(urgencyText, "");
  const resolvedCta = safe(ctaText, "");
  const resolvedPriceText = safe(priceText, "가격 문의");
  const resolvedEventBadge = safe(eventBadge, "공동특가");
  const resolvedStockText = safe(stockText, "");
  const resolvedOriginalPriceText = safe(originalPriceText, "");
  const resolvedInquiryHref = safe(inquiryHref, "#inquiry-request");
  const resolvedCatalogHref = safe(catalogHref, "");
  const resolvedYoutubeUrl = safe(youtubeUrl, "");
  const resolvedImageUrl = safe(imageUrl, "");

  const resolvedPoints = points
    .map((item) => safe(item, ""))
    .filter(Boolean)
    .slice(0, 3);

  const showVideoButton = !!resolvedYoutubeUrl;
  const showCatalogButton = !!resolvedCatalogHref;
  const showPoints = resolvedPoints.length > 0;

  return (
    <article style={S.card} className="booth-product-card">
      <style>{RESPONSIVE_CSS}</style>

      <div style={S.top} className="booth-product-card-top">
        <div style={S.badgeWrap}>
          <div style={S.badge}>{resolvedEventBadge}</div>
          {resolvedStockText ? <div style={S.stock}>{resolvedStockText}</div> : null}
        </div>

        <div style={S.priceBox} className="booth-product-card-pricebox">
          {resolvedOriginalPriceText ? (
            <div style={S.originalPrice}>정상가 {resolvedOriginalPriceText}</div>
          ) : null}
          <div style={S.price}>{resolvedPriceText}</div>
        </div>
      </div>

      <div style={S.name}>{resolvedName}</div>

      {resolvedHook ? <div style={S.hook}>{resolvedHook}</div> : null}

      {resolvedImageUrl ? (
        <a
          href={resolvedInquiryHref}
          style={S.imageWrap}
          aria-label={`${resolvedName} 문의하기`}
        >
          <img src={resolvedImageUrl} alt={resolvedName} style={S.image} />
        </a>
      ) : (
        <div style={S.imageEmpty}>이미지 준비중</div>
      )}

      {resolvedUrgency ? <div style={S.urgency}>{resolvedUrgency}</div> : null}

      {resolvedBody ? <div style={S.body}>{resolvedBody}</div> : null}

      {showPoints ? (
        <div style={S.points}>
          {resolvedPoints.map((point, index) => (
            <div key={`${point}-${index}`} style={S.point}>
              ✓ {point}
            </div>
          ))}
        </div>
      ) : null}

      {resolvedCta ? <div style={S.cta}>{resolvedCta}</div> : null}

      <div style={S.actions} className="booth-product-card-actions">
        <a
          href={resolvedInquiryHref}
          style={S.mainBtn}
          className="booth-product-card-mainbtn"
        >
          지금 문의하기
        </a>

        {showCatalogButton ? (
          <a
            href={resolvedCatalogHref}
            target="_blank"
            rel="noreferrer"
            style={S.subBtn}
            className="booth-product-card-subbtn"
          >
            카탈로그
          </a>
        ) : null}

        {showVideoButton ? (
          <a
            href={resolvedYoutubeUrl}
            target="_blank"
            rel="noreferrer"
            style={S.videoBtn}
            className="booth-product-card-videobtn"
          >
            {isYoutubeUrl(resolvedYoutubeUrl) ? "영상 보기" : "링크 보기"}
          </a>
        ) : null}
      </div>
    </article>
  );
}

const S: Record<string, React.CSSProperties> = {
  card: {
    border: "1px solid #f3f4f6",
    borderRadius: 22,
    padding: 18,
    background: "#ffffff",
    display: "grid",
    gap: 14,
    boxShadow: "0 12px 28px rgba(15,23,42,0.06)",
  },
  top: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  badgeWrap: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  badge: {
    background: "#dc2626",
    color: "#fff",
    padding: "7px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    lineHeight: 1.2,
  },
  stock: {
    fontSize: 12,
    fontWeight: 900,
    color: "#92400e",
    background: "#fef3c7",
    border: "1px solid #fde68a",
    padding: "7px 12px",
    borderRadius: 999,
    lineHeight: 1.2,
  },
  name: {
    fontSize: 26,
    fontWeight: 950,
    lineHeight: 1.25,
    color: "#111827",
  },
  hook: {
    fontSize: 15,
    fontWeight: 800,
    color: "#374151",
    lineHeight: 1.7,
  },
  imageWrap: {
    borderRadius: 16,
    overflow: "hidden",
    display: "block",
    textDecoration: "none",
    background: "#fff",
    border: "1px solid #e5e7eb",
  },
  image: {
    width: "100%",
    height: 300,
    objectFit: "contain",
    display: "block",
    background: "#fff",
  },
  imageEmpty: {
    height: 240,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
    color: "#64748b",
    borderRadius: 16,
    border: "1px dashed #cbd5e1",
    fontWeight: 800,
  },
  priceBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 4,
  },
  originalPrice: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: 800,
    textDecoration: "line-through",
  },
  price: {
    fontSize: 34,
    fontWeight: 950,
    color: "#dc2626",
    lineHeight: 1.05,
  },
  urgency: {
    background: "#fff7ed",
    padding: "12px 14px",
    borderRadius: 14,
    fontWeight: 900,
    fontSize: 14,
    color: "#c2410c",
    lineHeight: 1.7,
    border: "1px solid #fdba74",
  },
  body: {
    fontSize: 15,
    lineHeight: 1.8,
    color: "#334155",
    whiteSpace: "pre-wrap",
  },
  points: {
    display: "grid",
    gap: 6,
  },
  point: {
    fontSize: 14,
    fontWeight: 800,
    color: "#111827",
    lineHeight: 1.7,
  },
  cta: {
    fontSize: 14,
    fontWeight: 800,
    color: "#111827",
    lineHeight: 1.7,
  },
  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 10,
  },
  mainBtn: {
    background: "#111827",
    color: "#fff",
    padding: "14px 12px",
    borderRadius: 14,
    textAlign: "center",
    fontWeight: 900,
    textDecoration: "none",
    fontSize: 15,
  },
  subBtn: {
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    padding: "14px 12px",
    borderRadius: 14,
    textAlign: "center",
    textDecoration: "none",
    fontWeight: 800,
    fontSize: 14,
  },
  videoBtn: {
    background: "#f3f4f6",
    color: "#111827",
    padding: "14px 12px",
    borderRadius: 14,
    textAlign: "center",
    textDecoration: "none",
    fontWeight: 800,
    fontSize: 14,
    border: "1px solid #e5e7eb",
  },
};