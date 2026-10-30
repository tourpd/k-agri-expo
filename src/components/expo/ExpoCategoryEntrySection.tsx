import React from "react";
import Link from "next/link";
import { EXPO_HALL_LIST } from "@/lib/expo/halls";

// 전시관 목록은 src/lib/expo/halls.ts 한 곳에서 관리 (없는 화면으로 가던 링크 4개 수정)
const HALLS = EXPO_HALL_LIST;

export default function ExpoCategoryEntrySection() {
  return (
    <section style={wrap}>
      <div style={eyebrow}>HALL ENTRY</div>

      <h2 style={title} className="expo-section-title">
        필요한 농사 문제부터 들어가세요
      </h2>

      <p style={desc} className="expo-section-desc">
        K-Agri Expo는 단순 상품 나열이 아니라, 농민이 겪는 문제와 시기별
        필요에 맞춰 전문 전시관으로 들어가는 구조입니다.
      </p>

      <div style={grid} className="expo-category-grid expo-entry-grid">
        {HALLS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
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
              <span style={cta}>{item.cta}</span>
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
  maxWidth: 820,
  wordBreak: "keep-all",
};

const grid: React.CSSProperties = {
  marginTop: 20,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
  gap: 12,
};

const card: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  minHeight: 210,
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