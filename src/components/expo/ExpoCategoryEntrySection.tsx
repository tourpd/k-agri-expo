import React from "react";
import Link from "next/link";

const CATEGORIES = [
  {
    hallId: "fertilizer",
    icon: "🌱",
    title: "비료관",
    desc: "기비·추비·비대·활력 관련 제품",
  },
  {
    hallId: "eco-inputs",
    icon: "🍀",
    title: "친환경자재관",
    desc: "친환경 병해충·영양 관리 자재",
  },
  {
    hallId: "machinery",
    icon: "🚜",
    title: "농기계관",
    desc: "작업 효율을 높이는 농기계",
  },
  {
    hallId: "seed",
    icon: "🌾",
    title: "종자관",
    desc: "작물별 우수 종자·육묘 관련",
  },
  {
    hallId: "smart-farm",
    icon: "📱",
    title: "스마트농업관",
    desc: "센서·제어·자동화 장비",
  },
  {
    hallId: "future-insect",
    icon: "🦗",
    title: "미래곤충관",
    desc: "곤충 산업의 생산·가공·장비·교육",
  },
];

export default function ExpoCategoryEntrySection() {
  return (
    <section style={wrap}>
      <div style={eyebrow}>CATEGORY ENTRY</div>

      <h2 style={title} className="expo-section-title">
        원하는 분야부터 들어가세요
      </h2>

      <p style={desc} className="expo-section-desc">
        농민이 찾는 방식대로 카테고리를 먼저 고르고,
        그 안에서 필요한 부스와 제품을 빠르게 확인할 수 있게 구성했습니다.
      </p>

      <div style={grid} className="expo-category-grid expo-entry-grid">
        {CATEGORIES.map((item) => (
          <Link
            key={item.hallId}
            href={`/expo/hall/${item.hallId}`}
            style={card}
            className="expo-category-card expo-entry-card"
          >
            <div style={cardTop}>
              <div style={iconWrap}>
                <span style={icon}>{item.icon}</span>
              </div>

              <div style={cardTitle}>{item.title}</div>
              <div style={cardDesc}>{item.desc}</div>
            </div>

            <div style={ctaRow}>
              <span style={cta}>카테고리 보기</span>
              <span style={arrow}>→</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

const wrap: React.CSSProperties = {
  marginTop: 8,
};

const eyebrow: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 950,
  color: "#16a34a",
  letterSpacing: 0.6,
};

const title: React.CSSProperties = {
  marginTop: 10,
  fontSize: 40,
  lineHeight: 1.12,
  fontWeight: 950,
  color: "#0f172a",
  letterSpacing: -1,
  wordBreak: "keep-all",
};

const desc: React.CSSProperties = {
  marginTop: 12,
  fontSize: 15,
  lineHeight: 1.75,
  color: "#64748b",
  maxWidth: 780,
  wordBreak: "keep-all",
};

const grid: React.CSSProperties = {
  marginTop: 20,
  display: "grid",
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  gap: 12,
};

const card: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  minHeight: 200,
  padding: "16px 14px",
  borderRadius: 20,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  textDecoration: "none",
  color: "#0f172a",
  boxShadow: "0 8px 18px rgba(15,23,42,0.04)",
};

const cardTop: React.CSSProperties = {
  display: "block",
};

const iconWrap: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 14,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const icon: React.CSSProperties = {
  fontSize: 24,
  lineHeight: 1,
};

const cardTitle: React.CSSProperties = {
  marginTop: 14,
  fontSize: 18,
  lineHeight: 1.3,
  fontWeight: 950,
  color: "#0f172a",
  wordBreak: "keep-all",
};

const cardDesc: React.CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  lineHeight: 1.6,
  color: "#64748b",
  wordBreak: "keep-all",
};

const ctaRow: React.CSSProperties = {
  marginTop: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

const cta: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 950,
  color: "#0f172a",
  lineHeight: 1.2,
};

const arrow: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 950,
  color: "#0f172a",
  lineHeight: 1,
};