import React from "react";
import Link from "next/link";

export default function ExpoTopBar() {
  return (
    <header style={S.wrap} className="expo-topbar">
      <div style={S.left}>
        <Link href="/expo" style={S.brandWrap}>
          <div style={S.logoBox}>K</div>
          <div>
            <div style={S.brandTitle}>K-Agri Expo</div>
            <div style={S.brandDesc}>대한민국 농업 온라인 박람회</div>
          </div>
        </Link>
      </div>

      <div style={S.right} className="expo-header-right">
        <div style={S.actions} className="expo-top-actions">
          <Link href="/expo/enter" style={S.primaryBtn}>
            입장 안내
          </Link>

          <Link href="/expo/deals" style={S.ghostBtn}>
            EXPO 특가
          </Link>

          <Link href="/expo#consult" style={S.ghostBtn}>
            농사 상담
          </Link>
        </div>
      </div>
    </header>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "20px 24px 10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  brandWrap: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    textDecoration: "none",
    color: "#0f172a",
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: "#16a34a",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 950,
    fontSize: 22,
    boxShadow: "0 10px 24px rgba(22,163,74,0.18)",
    flexShrink: 0,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: 950,
    lineHeight: 1.2,
    color: "#0f172a",
  },
  brandDesc: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
  },
  right: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    flexWrap: "wrap",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  primaryBtn: {
    textDecoration: "none",
    background: "#0f172a",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 14,
    boxShadow: "0 10px 24px rgba(15,23,42,0.12)",
  },
  ghostBtn: {
    textDecoration: "none",
    background: "#fff",
    color: "#0f172a",
    padding: "12px 16px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 14,
    border: "1px solid #e2e8f0",
  },
};