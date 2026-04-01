"use client";

import React from "react";
import ExpoTabs from "@/components/expo/ExpoTabs";

export default function ExpoChrome({ children }: { children: React.ReactNode }) {
  return (
    <div style={wrap}>
      <header style={header}>
        <div style={brandRow}>
          <div style={brandLeft}>
            <div style={brandTitle}>K-Agri Expo</div>
          </div>
          <div style={brandRight}>모바일 우선 UI · PC 최대 900px</div>
        </div>
      </header>

      {/* ✅ 본문: 하단 탭 겹침 대비 + 클릭 안정 */}
      <main style={main}>{children}</main>

      {/* ✅ 하단 탭(고정) */}
      <ExpoTabs />

      {/* ✅ footer는 탭과 분리 (겹치면 클릭/시야 방해되므로 sticky/fixed 쓰지 않음) */}
      <footer style={footer}>
        <div>© K-Agri Expo</div>
        <div>제작: 한국농수산TV</div>
      </footer>
    </div>
  );
}

/**
 * ✅ 하단 탭 고정(fixed)일 때:
 * - main 하단 패딩을 충분히 확보해야 "입장하기" 버튼이 탭에 가려져 클릭이 막히지 않습니다.
 * - footer는 탭 아래 공간을 더 먹지 않게, 별도 안전 패딩만 주고 평범하게 두는게 안정적입니다.
 */
const TAB_H = 74; // ExpoTabs 실제 높이(대략)
const TAB_SAFE = TAB_H + 36; // 손가락/아이폰 홈바/여백 포함 안전치

const wrap: React.CSSProperties = {
  minHeight: "100svh",
  background: "#fff",
  color: "#111",
};

const header: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 20,
  background: "#fff",
  borderBottom: "1px solid #e5e7eb",
};

const brandRow: React.CSSProperties = {
  maxWidth: 900,
  margin: "0 auto",
  padding: "14px 14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const brandLeft: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 10,
};

const brandTitle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 950,
  letterSpacing: -0.2,
};

const brandRight: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 900,
  color: "#6b7280",
  whiteSpace: "nowrap",
};

const main: React.CSSProperties = {
  maxWidth: 900,
  margin: "0 auto",
  padding: `16px 14px ${TAB_SAFE}px`,
};

const footer: React.CSSProperties = {
  maxWidth: 900,
  margin: "0 auto",
  padding: "12px 14px 24px",
  borderTop: "1px solid #f3f4f6",
  color: "#6b7280",
  fontSize: 14,
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
};