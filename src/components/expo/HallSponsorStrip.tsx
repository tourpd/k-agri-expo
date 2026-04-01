import Link from "next/link";
import React from "react";
import { ExpoFeatureSlotResolved, resolveFeatureHref } from "@/lib/expoFeatureSlots";

export default function HallSponsorStrip({
  title,
  items,
}: {
  title: string;
  items: ExpoFeatureSlotResolved[];
}) {
  const safeItems = items.filter(Boolean).slice(0, 5);

  if (safeItems.length === 0) return null;

  return (
    <section style={S.wrap}>
      <div style={S.head}>
        <div>
          <div style={S.badge}>PREMIUM SPONSOR</div>
          <h2 style={S.title}>{title}</h2>
          <div style={S.sub}>
            이 전시관에서 가장 먼저 보여지는 프리미엄 스폰서 부스입니다.
          </div>
        </div>
      </div>

      <div style={S.grid}>
        {safeItems.map((item, idx) => {
          const cover = item.cover_image_url ?? item.logo_url ?? null;
          const logo = item.logo_url ?? null;
          const href = resolveFeatureHref(item.primary_target_type, item.primary_target_value);

          const CardTag = href ? Link : "div";
          const cardProps =
            href
              ? {
                  href,
                  target: item.primary_target_type === "custom" ? "_blank" : undefined,
                  style: S.card,
                }
              : { style: S.card };

          return (
            <CardTag key={item.slot_id} {...(cardProps as any)}>
              <div style={S.imageArea}>
                {cover ? (
                  <img src={cover} alt={item.title ?? "부스"} style={S.coverImage} />
                ) : (
                  <div style={S.imageFallback}>이미지 준비중</div>
                )}

                <div style={S.imageOverlay} />
                <div style={S.rankBox}>{String(idx + 1).padStart(2, "0")}</div>

                {logo ? (
                  <div style={S.logoBox}>
                    <img src={logo} alt={`${item.title ?? "부스"} 로고`} style={S.logoImage} />
                  </div>
                ) : null}
              </div>

              <div style={S.content}>
                <div style={S.name}>{item.title ?? "프리미엄 부스"}</div>
                <div style={S.meta}>
                  {item.booth_region ?? "지역 미입력"} · {item.booth_category_primary ?? "카테고리 미입력"}
                </div>
                <div style={S.intro}>
                  {item.subtitle?.trim() ? item.subtitle : "이 전시관의 프리미엄 스폰서 부스입니다."}
                </div>
                <div style={S.cta}>{item.primary_cta_text ?? "자세히 보기"} →</div>
              </div>
            </CardTag>
          );
        })}
      </div>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    marginTop: 22,
    borderRadius: 28,
    padding: 18,
    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    border: "1px solid #e2e8f0",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.06)",
  },
  head: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 10,
    flexWrap: "wrap",
  },
  badge: {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 950,
    padding: "6px 10px",
    borderRadius: 999,
    background: "#0f172a",
    color: "#fff",
  },
  title: {
    margin: "12px 0 0",
    fontSize: 26,
    fontWeight: 950,
    letterSpacing: -0.4,
    color: "#0f172a",
  },
  sub: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.8,
  },
  grid: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 14,
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    overflow: "hidden",
    textDecoration: "none",
    color: "#111",
    background: "#fff",
    display: "block",
    minHeight: 340,
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
  },
  imageArea: {
    position: "relative",
    width: "100%",
    aspectRatio: "16 / 10",
    background: "#f1f5f9",
    overflow: "hidden",
  },
  coverImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  imageFallback: {
    width: "100%",
    height: "100%",
    background: "#f1f5f9",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 900,
  },
  imageOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.22) 100%)",
  },
  rankBox: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 2,
    minWidth: 42,
    height: 42,
    borderRadius: 999,
    background: "rgba(15,23,42,0.86)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 950,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
  },
  logoBox: {
    position: "absolute",
    right: 12,
    bottom: 12,
    zIndex: 2,
    width: 62,
    height: 62,
    borderRadius: 18,
    background: "rgba(255,255,255,0.96)",
    padding: 7,
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 20px rgba(0,0,0,0.16)",
  },
  logoImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 17,
    fontWeight: 950,
    lineHeight: 1.28,
    color: "#0f172a",
  },
  meta: {
    marginTop: 8,
    fontSize: 12,
    color: "#64748b",
    lineHeight: 1.6,
    fontWeight: 800,
  },
  intro: {
    marginTop: 10,
    fontSize: 13,
    color: "#334155",
    lineHeight: 1.7,
    minHeight: 46,
  },
  cta: {
    marginTop: 14,
    fontWeight: 950,
    fontSize: 13,
    color: "#0f172a",
  },
};