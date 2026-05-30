import React from "react";

type Props = {
  description?: string | null;
};

export default function ProductDetailSection({ description }: Props) {
  return (
    <section style={S.detail}>
      <h3 style={S.sectionHeading}>제품 설명</h3>
      <p style={S.detailText}>{description || "상세 설명이 없습니다."}</p>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  detail: {
    marginTop: 24,
  },

  sectionHeading: {
    fontSize: 20,
    fontWeight: 900,
    marginBottom: 12,
    color: "#111827",
  },

  detailText: {
    fontSize: 16,
    lineHeight: 1.9,
    color: "#374151",
    wordBreak: "keep-all",
    whiteSpace: "pre-wrap",
  },
};