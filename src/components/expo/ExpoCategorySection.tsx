import React from "react";
import Link from "next/link";
import type { ExpoCategory } from "@/lib/expo/categories";

export default function ExpoCategorySection({
  items,
}: {
  items: ExpoCategory[];
}) {
  if (!items || items.length === 0) return null;

  return (
    <section style={S.section} className="expo-section">
      <div style={S.head}>
        <div>
          <div style={S.kicker}>CATEGORY ENTRY</div>
          <h2 style={S.title}>원하는 분야부터 들어가세요</h2>
          <div style={S.desc}>
            농민이 찾는 방식대로 카테고리를 먼저 고르고, 그 안에서 부스와 제품을 확인하게 구성합니다.
          </div>
        </div>
      </div>

      <div style={S.grid}>
        {items.map((item) => (
          <Link key={item.category_id} href={`/expo/category/${item.slug}`} style={S.card}>
            <div style={S.icon}>{item.icon || "📦"}</div>
            <div style={S.name}>{item.name}</div>
            <div style={S.shortDesc}>{item.short_desc || "카테고리 소개 준비 중"}</div>
            <div style={S.cta}>카테고리 보기 →</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  section: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "28px 24px 0",
  },
  head: {
    marginBottom: 16,
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
    letterSpacing: 0.3,
  },
  title: {
    margin: "8px 0 0",
    fontSize: 34,
    fontWeight: 950,
    color: "#0f172a",
  },
  desc: {
    marginTop: 10,
    color: "#64748b",
    fontSize: 15,
    lineHeight: 1.8,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 14,
  },
  card: {
    textDecoration: "none",
    color: "#0f172a",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    padding: 18,
    minHeight: 180,
    boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
  },
  icon: {
    fontSize: 28,
  },
  name: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: 950,
    lineHeight: 1.2,
  },
  shortDesc: {
    marginTop: 10,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.7,
    minHeight: 50,
  },
  cta: {
    marginTop: 16,
    fontWeight: 950,
    fontSize: 14,
  },
};