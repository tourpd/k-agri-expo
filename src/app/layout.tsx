// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import React from "react";
import BrandChrome from "@/components/BrandChrome";

export const metadata: Metadata = {
  title: "K-Agri Expo",
  description: "K-Agri Expo · 제작: 한국농수산TV",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // ⚠️ 관리자 경로 감지
  const isAdmin =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/admin");

  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: "system-ui" }}>
        {isAdmin ? children : <BrandChrome>{children}</BrandChrome>}
      </body>
    </html>
  );
}