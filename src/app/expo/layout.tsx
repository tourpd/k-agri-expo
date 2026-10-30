export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import AdminNavLink from "@/components/expo/admin/AdminNavLink";

/**
 * 엑스포 공통 틀: 위쪽 메뉴 하나 + 본문 + 아래쪽
 * (예전에는 홈에 메뉴가 두 줄로 겹쳐 나오고, 홈에서 전시관·부스로 가는 메뉴가 없었음)
 */
const NAV = [
  { href: "/expo/hall", label: "전시관" },
  { href: "/expo/booths", label: "참여 부스" },
  { href: "/expo/deals", label: "농민 특가" },
  { href: "/ai-consult", label: "농사 상담" },
];

const LAYOUT_CSS = `
.expo-shell-header { position: sticky; top: 0; z-index: 50; }
.expo-shell-nav a:hover { background: #f1f5f9; }
.expo-shell-main { padding: 24px; }
@media (max-width: 768px) {
  .expo-shell-header { padding: 10px 12px !important; flex-wrap: wrap; gap: 8px !important; }
  .expo-shell-nav { width: 100%; display: grid !important; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px !important; }
  .expo-shell-nav a { text-align: center; padding: 9px 4px !important; font-size: 13px !important; }
  .expo-shell-main { padding: 12px; }
}
`;

export default function ExpoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f6f7",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{LAYOUT_CSS}</style>

      <header
        className="expo-shell-header"
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5e5e5",
          padding: "12px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Link
          href="/expo"
          style={{
            fontWeight: 900,
            fontSize: 18,
            textDecoration: "none",
            color: "#111",
            whiteSpace: "nowrap",
          }}
        >
          🌾 K-Agri Expo
        </Link>

        <nav
          className="expo-shell-nav"
          aria-label="엑스포 메뉴"
          style={{ display: "flex", gap: 4, alignItems: "center" }}
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 800,
                color: "#0f172a",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </Link>
          ))}
          <AdminNavLink hallId="agri-inputs" />
        </nav>
      </header>

      <main
        className="expo-shell-main"
        style={{
          flex: 1,
          maxWidth: 1200,
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        {children}
      </main>

      <footer
        style={{
          borderTop: "1px solid #e5e5e5",
          background: "#ffffff",
          padding: "12px 24px",
          fontSize: 12,
          color: "#777",
          textAlign: "center",
        }}
      >
        © {new Date().getFullYear()} K-Agri Expo · 한국농수산TV · 문의 010-8216-1253 ·{" "}
        <Link href="/admin/login" style={{ color: "#999" }}>
          운영자
        </Link>
      </footer>
    </div>
  );
}
