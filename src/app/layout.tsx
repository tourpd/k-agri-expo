// src/app/layout.tsx

import type { Metadata, Viewport } from "next";
import "./globals.css";
import React from "react";
import BrandChrome from "@/components/BrandChrome";
import RegisterServiceWorker from "@/components/pwa/RegisterServiceWorker";

export const metadata: Metadata = {
  title: "K-Agri Expo",
  description: "K-Agri Expo · 제작: 한국농수산TV",

  manifest: "/manifest.json",

  icons: {
    icon: [
      {
        url: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],

    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },

  appleWebApp: {
    capable: true,
    title: "K-Agri Expo",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A5F35",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui",
        }}
      >
        <RegisterServiceWorker />
        <BrandChrome>{children}</BrandChrome>
      </body>
    </html>
  );
}