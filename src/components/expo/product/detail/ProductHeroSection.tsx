import React from "react";

type Props = {
  urgencyText?: string | null;
  title?: string | null;
  headline?: string | null;
};

export default function ProductHeroSection({
  urgencyText,
  title,
  headline,
}: Props) {
  return (
    <section style={S.hero}>
      <div style={S.badge}>{urgencyText || "농가 필수 제품"}</div>

      <h1 style={S.title}>{title || "제품명 없음"}</h1>

      <div style={S.headline}>
        {headline || "이 제품의 핵심 메시지를 입력하세요"}
      </div>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  hero: {
    marginBottom: 20,
  },

  badge: {
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "6px 12px",
    borderRadius: 999,
    display: "inline-block",
    fontWeight: 800,
    fontSize: 13,
  },

  title: {
    fontSize: 32,
    fontWeight: 900,
    marginTop: 14,
    marginBottom: 10,
    lineHeight: 1.25,
    color: "#111827",
  },

  headline: {
    marginTop: 10,
    fontSize: 17,
    lineHeight: 1.8,
    color: "#374151",
    wordBreak: "keep-all",
    whiteSpace: "pre-wrap",
  },
};