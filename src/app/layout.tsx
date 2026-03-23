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
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: "system-ui" }}>
        <BrandChrome>{children}</BrandChrome>
      </body>
    </html>
  );
}