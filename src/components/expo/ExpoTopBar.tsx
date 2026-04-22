import React from "react";
import Link from "next/link";

export default function ExpoTopBar() {
  return (
    <header style={S.wrap} className="expo-topbar">
      <div style={S.left}>
        <Link href="/expo" style={S.brandWrap}>
          <div style={S.logoBox}>K</div>

          <div style={S.brandTextWrap}>
            <div style={S.brandTitle}>K-Agri Expo</div>
            <div style={S.brandDesc}>대한민국 농업 온라인 박람회</div>
          </div>
        </Link>
      </div>

      <div style={S.right} className="expo-header-right">
        <nav style={S.actions} className="expo-top-actions" aria-label="엑스포 빠른 메뉴">
          <Link href="/expo/enter" style={S.primaryBtn}>
            입장 안내
          </Link>

          <Link href="/expo/deals" style={S.ghostBtn}>
            EXPO 특가
          </Link>

          <Link href="/expo#consult" style={S.ghostBtn}>
            농사 상담
          </Link>
        </nav>
      </div>
    </header>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "14px 16px 8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  left: {
    display: "flex",
    alignItems: "center",
    minWidth: 0,
    flex: "1 1 260px",
  },

  brandWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none",
    color: "#0f172a",
    minWidth: 0,
  },

  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    background: "#16a34a",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 950,
    fontSize: 18,
    boxShadow: "0 8px 18px rgba(22,163,74,0.16)",
    flexShrink: 0,
  },

  brandTextWrap: {
    minWidth: 0,
  },

  brandTitle: {
    fontSize: 16,
    fontWeight: 950,
    lineHeight: 1.2,
    color: "#0f172a",
    letterSpacing: -0.3,
    wordBreak: "keep-all",
  },

  brandDesc: {
    marginTop: 2,
    fontSize: 11,
    color: "#64748b",
    fontWeight: 700,
    lineHeight: 1.35,
    wordBreak: "keep-all",
  },

  right: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flex: "0 1 auto",
    minWidth: 0,
  },

  actions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    flexWrap: "wrap",
  },

  primaryBtn: {
    textDecoration: "none",
    background: "#0f172a",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 13,
    lineHeight: 1.2,
    boxShadow: "0 8px 18px rgba(15,23,42,0.10)",
    whiteSpace: "nowrap",
  },

  ghostBtn: {
    textDecoration: "none",
    background: "#fff",
    color: "#0f172a",
    padding: "10px 14px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 13,
    lineHeight: 1.2,
    border: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },
};