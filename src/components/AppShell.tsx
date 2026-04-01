import React from "react";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
  title?: string;
  backHref?: string;
  rightSlot?: React.ReactNode;
};

export default function AppShell({ children, title, backHref, rightSlot }: Props) {
  return (
    <div style={root}>
      <header style={header}>
        <div style={headerInner}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {backHref ? (
              <Link href={backHref} style={backBtn} aria-label="뒤로">
                ←
              </Link>
            ) : null}

            <div style={{ minWidth: 0 }}>
              <div style={brand}>K-Agri Expo</div>
              {title ? <div style={titleStyle}>{title}</div> : null}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>{rightSlot}</div>
        </div>
      </header>

      <main style={main}>
        <div style={container}>{children}</div>
      </main>

      <footer style={footer}>
        <div style={container}>
          <div style={{ opacity: 0.85 }}>© K-Agri Expo · 모바일 우선 UI(PC 최대 900px)</div>
        </div>
      </footer>
    </div>
  );
}

/** ✅ 모바일 퍼스트 + PC 900 확장 */
const MAX_W = 900;

const root: React.CSSProperties = {
  minHeight: "100vh",
  background: "#fff",
  color: "#111",
  fontFamily: "system-ui",
};

const container: React.CSSProperties = {
  width: "100%",
  maxWidth: MAX_W,
  margin: "0 auto",
  padding: "0 14px", // ✅ 모바일 기본 좌우 여백
};

const header: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 50,
  background: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(8px)",
  borderBottom: "1px solid #eee",
};

const headerInner: React.CSSProperties = {
  ...container,
  height: 64,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const brand: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 950,
  opacity: 0.75,
  lineHeight: 1.1,
};

const titleStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 20, // ✅ 모바일에서도 크게
  fontWeight: 950,
  lineHeight: 1.1,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const backBtn: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  background: "#fff",
  textDecoration: "none",
  color: "#111",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
  fontWeight: 950,
};

const main: React.CSSProperties = {
  padding: "14px 0 18px",
};

const footer: React.CSSProperties = {
  borderTop: "1px solid #eee",
  padding: "14px 0",
  fontSize: 13,
  color: "#666",
};