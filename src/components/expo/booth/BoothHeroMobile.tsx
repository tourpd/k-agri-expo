import React from "react";

type BoothHeroMobileProps = {
  name: string;
  intro: string;
  imageUrl?: string | null;
  primaryCtaHref?: string;
  secondaryCtaHref?: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
  badgeText?: string;
};

function safe(v: unknown, fallback = "") {
  const s = typeof v === "string" ? v : "";
  return s.trim() ? s.trim() : fallback;
}

export default function BoothHeroMobile({
  name,
  intro,
  imageUrl,
  primaryCtaHref = "#inquiry-request",
  secondaryCtaHref = "#products",
  primaryCtaLabel = "지금 문의하기",
  secondaryCtaLabel = "대표 제품 보기",
  badgeText = "EXPO BOOTH",
}: BoothHeroMobileProps) {
  const resolvedName = safe(name, "부스");
  const resolvedIntro = safe(
    intro,
    "작물 상태에 맞는 제품과 상담 정보를 바로 확인해보십시오."
  );
  const resolvedImageUrl = safe(imageUrl, "");

  return (
    <section style={S.wrap}>
      <div style={S.imageWrap}>
        {resolvedImageUrl ? (
          <img src={resolvedImageUrl} alt={resolvedName} style={S.image} />
        ) : (
          <div style={S.imageEmpty}>대표 이미지 준비 중</div>
        )}
      </div>

      <div style={S.body}>
        <div style={S.badge}>{badgeText}</div>
        <h1 style={S.title}>{resolvedName}</h1>
        <p style={S.intro}>{resolvedIntro}</p>

        <div style={S.actions}>
          <a href={primaryCtaHref} style={S.primaryBtn}>
            {primaryCtaLabel}
          </a>
          <a href={secondaryCtaHref} style={S.secondaryBtn}>
            {secondaryCtaLabel}
          </a>
        </div>
      </div>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    display: "grid",
    gap: 14,
  },
  imageWrap: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
  },
  image: {
    width: "100%",
    height: 240,
    objectFit: "cover",
    display: "block",
  },
  imageEmpty: {
    height: 240,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    fontWeight: 800,
    background: "#f8fafc",
  },
  body: {
    display: "grid",
    gap: 10,
  },
  badge: {
    fontSize: 12,
    fontWeight: 900,
    color: "#16a34a",
    letterSpacing: 0.4,
  },
  title: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1.2,
    fontWeight: 950,
    color: "#0f172a",
    wordBreak: "keep-all",
  },
  intro: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.8,
    color: "#475569",
    whiteSpace: "pre-wrap",
    wordBreak: "keep-all",
  },
  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginTop: 4,
  },
  primaryBtn: {
    minHeight: 46,
    borderRadius: 14,
    background: "#166534",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 12px",
    textAlign: "center",
  },
  secondaryBtn: {
    minHeight: 46,
    borderRadius: 14,
    background: "#fff",
    color: "#0f172a",
    textDecoration: "none",
    fontWeight: 900,
    border: "1px solid #cbd5e1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 12px",
    textAlign: "center",
  },
};