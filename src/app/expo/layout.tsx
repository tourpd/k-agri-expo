export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import AdminNavLink from "@/components/expo/admin/AdminNavLink";

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
      {/* 상단 헤더 */}
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5e5e5",
          padding: "14px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* 좌측 로고 */}
        <Link
          href="/expo"
          style={{
            fontWeight: 900,
            fontSize: 18,
            textDecoration: "none",
            color: "#111",
          }}
        >
          🌾 K-Agri Expo
        </Link>

        {/* 우측 관리자 메뉴만 유지 */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <AdminNavLink hallId="agri-inputs" />
        </div>
      </header>

      {/* 본문 */}
      <main
        style={{
          flex: 1,
          padding: "24px",
          maxWidth: 1200,
          width: "100%",
          margin: "0 auto",
        }}
      >
        {children}
      </main>

      {/* 하단 */}
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
        © {new Date().getFullYear()} K-Agri Expo · 한국농수산TV
      </footer>
    </div>
  );
}