"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExpoFeatureSlotResolved, resolveFeatureHref } from "@/lib/expoFeatureSlots";

export default function MainSponsorSlider({
  items,
}: {
  items: ExpoFeatureSlotResolved[];
}) {
  const safeItems = useMemo(() => items.filter(Boolean).slice(0, 5), [items]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (safeItems.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % safeItems.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [safeItems.length]);

  if (safeItems.length === 0) {
    return (
      <section style={S.wrap}>
        <div style={S.empty}>
          <div style={S.emptyTitle}>메인관 프리미엄 스폰서 준비중</div>
          <div style={S.emptyText}>
            전시장 편성실에서 메인 슬라이드 슬롯을 지정하면 여기에 바로 반영됩니다.
          </div>
        </div>
      </section>
    );
  }

  const current = safeItems[index];
  const title = current.title ?? "프리미엄 부스";
  const intro = current.subtitle?.trim()
    ? current.subtitle
    : "대한민국 농업 온라인 박람회 메인 스폰서 부스입니다.";
  const meta = `${current.booth_region ?? "지역 미입력"} · ${current.booth_category_primary ?? "카테고리 미입력"}`;
  const cover = current.cover_image_url ?? null;
  const logo = current.logo_url ?? null;

  const primaryHref = resolveFeatureHref(
    current.primary_target_type,
    current.primary_target_value
  );
  const secondaryHref = resolveFeatureHref(
    current.secondary_target_type,
    current.secondary_target_value
  );

  return (
    <section style={S.wrap}>
      <div style={S.hero}>
        {cover ? (
          <img src={cover} alt={title} style={S.bgImage} />
        ) : (
          <div style={S.bgFallback} />
        )}

        <div style={S.overlay}>
          <div style={S.topRow}>
            <div style={S.badge}>MAIN SPONSOR</div>

            {logo ? (
              <div style={S.logoBox}>
                <img src={logo} alt={`${title} 로고`} style={S.logoImage} />
              </div>
            ) : null}
          </div>

          <div style={S.content}>
            <div style={S.kicker}>K-Agri Expo 2026</div>
            <h2 style={S.title}>{title}</h2>
            <div style={S.meta}>{meta}</div>
            <div style={S.desc}>{intro}</div>

            <div style={S.actions}>
              {primaryHref ? (
                <Link
                  href={primaryHref}
                  style={S.primaryBtn}
                  target={current.primary_target_type === "custom" ? "_blank" : undefined}
                >
                  {current.primary_cta_text ?? "자세히 보기"} →
                </Link>
              ) : null}

              {secondaryHref ? (
                <Link
                  href={secondaryHref}
                  style={S.ghostBtn}
                  target={current.secondary_target_type === "custom" ? "_blank" : undefined}
                >
                  {current.secondary_cta_text ?? "보조 링크"}
                </Link>
              ) : null}
            </div>
          </div>

          <div style={S.bottomBar}>
            <div style={S.slideCount}>
              <span style={S.slideCurrent}>{String(index + 1).padStart(2, "0")}</span>
              <span style={S.slideSlash}>/</span>
              <span style={S.slideTotal}>{String(safeItems.length).padStart(2, "0")}</span>
            </div>

            <div style={S.dots}>
              {safeItems.map((b, i) => (
                <button
                  key={b.slot_id}
                  type="button"
                  onClick={() => setIndex(i)}
                  style={{
                    ...S.dot,
                    ...(i === index ? S.dotActive : {}),
                  }}
                  aria-label={`${i + 1}번 슬라이드`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={S.sideList}>
        {safeItems.map((b, i) => (
          <button
            key={b.slot_id}
            type="button"
            onClick={() => setIndex(i)}
            style={{
              ...S.sideItem,
              ...(i === index ? S.sideItemActive : {}),
            }}
          >
            <div style={S.sideNum}>{String(i + 1).padStart(2, "0")}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={S.sideTitle}>{b.title ?? "프리미엄 부스"}</div>
              <div style={S.sideMeta}>
                {b.booth_region ?? "지역 미입력"} · {b.booth_category_primary ?? "카테고리 미입력"}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    maxWidth: 1320,
    margin: "22px auto 0",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 320px",
    gap: 16,
  },
  hero: {
    position: "relative",
    minHeight: 520,
    borderRadius: 32,
    overflow: "hidden",
    background: "#0b1220",
    boxShadow: "0 24px 70px rgba(15, 23, 42, 0.22)",
  },
  bgImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  bgFallback: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at top left, rgba(34,197,94,0.38) 0%, rgba(15,23,42,0.98) 42%, rgba(2,6,23,1) 100%)",
  },
  overlay: {
    position: "relative",
    zIndex: 1,
    minHeight: 520,
    padding: 32,
    background:
      "linear-gradient(90deg, rgba(2,6,23,0.86) 0%, rgba(2,6,23,0.55) 48%, rgba(2,6,23,0.18) 100%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    color: "#fff",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  badge: {
    display: "inline-block",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 12,
    fontWeight: 950,
    letterSpacing: 0.4,
    background: "rgba(255,255,255,0.12)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  logoBox: {
    width: 110,
    height: 110,
    borderRadius: 24,
    background: "rgba(255,255,255,0.96)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    boxSizing: "border-box",
    overflow: "hidden",
    boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
  },
  logoImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  },
  content: {
    maxWidth: 760,
    marginTop: 24,
  },
  kicker: {
    fontSize: 15,
    fontWeight: 900,
    color: "rgba(255,255,255,0.78)",
    letterSpacing: 0.2,
  },
  title: {
    margin: "14px 0 0",
    fontSize: 56,
    lineHeight: 1.06,
    fontWeight: 950,
    letterSpacing: -1.3,
  },
  meta: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: 800,
    color: "rgba(255,255,255,0.76)",
  },
  desc: {
    marginTop: 18,
    fontSize: 18,
    lineHeight: 1.9,
    color: "rgba(255,255,255,0.94)",
    maxWidth: 700,
  },
  actions: {
    marginTop: 24,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  primaryBtn: {
    padding: "14px 18px",
    borderRadius: 14,
    background: "#fff",
    color: "#0f172a",
    fontWeight: 950,
    textDecoration: "none",
    display: "inline-block",
    boxShadow: "0 10px 24px rgba(255,255,255,0.14)",
  },
  ghostBtn: {
    padding: "14px 18px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    fontWeight: 950,
    textDecoration: "none",
    display: "inline-block",
    border: "1px solid rgba(255,255,255,0.15)",
    backdropFilter: "blur(8px)",
  },
  bottomBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 24,
  },
  slideCount: {
    display: "flex",
    alignItems: "baseline",
    gap: 6,
    color: "#fff",
    fontWeight: 950,
  },
  slideCurrent: { fontSize: 24 },
  slideSlash: { fontSize: 18, opacity: 0.6 },
  slideTotal: { fontSize: 18, opacity: 0.8 },
  dots: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    border: "none",
    background: "rgba(255,255,255,0.32)",
    cursor: "pointer",
  },
  dotActive: {
    width: 30,
    background: "#22c55e",
  },
  sideList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  sideItem: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 22,
    padding: 16,
    display: "flex",
    gap: 12,
    alignItems: "center",
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(15, 23, 42, 0.04)",
  },
  sideItemActive: {
    border: "1px solid #0f172a",
    background: "#f8fafc",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.09)",
  },
  sideNum: {
    minWidth: 38,
    width: 38,
    height: 38,
    borderRadius: 999,
    background: "#0f172a",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 950,
  },
  sideTitle: {
    fontSize: 15,
    fontWeight: 950,
    color: "#0f172a",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  sideMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748b",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  empty: {
    width: "100%",
    borderRadius: 28,
    padding: 32,
    border: "1px dashed #cbd5e1",
    background: "#f8fafc",
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 950,
    color: "#0f172a",
  },
  emptyText: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 1.8,
    color: "#64748b",
  },
};