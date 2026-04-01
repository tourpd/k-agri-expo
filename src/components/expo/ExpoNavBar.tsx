// src/components/expo/ExpoNavBar.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string; icon: string };

const TABS: Tab[] = [
  { href: "/expo", label: "전시장", icon: "🗺️" },
  { href: "/expo/deals", label: "특가", icon: "🔥" },
  { href: "/expo/booths", label: "부스", icon: "🏢" },
  { href: "/expo/me", label: "내정보", icon: "👤" },
];

export default function ExpoNavBar() {
  const pathname = usePathname();

  return (
    <div style={barWrap} role="navigation" aria-label="K-Agri Expo 하단 탭">
      <div style={bar}>
        {TABS.map((t) => {
          const active =
            pathname === t.href ||
            (t.href !== "/expo" && pathname.startsWith(t.href)) ||
            (t.href === "/expo" && pathname === "/expo");

          return (
            <Link key={t.href} href={t.href} style={tab(active)}>
              <div style={icon(active)} aria-hidden>
                {t.icon}
              </div>
              <div style={label(active)}>{t.label}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** ✅ 고령층 UX: 큰 버튼/큰 글씨/대비 */
const barWrap: React.CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  display: "flex",
  justifyContent: "center",
  padding: "10px 10px env(safe-area-inset-bottom)",
  background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 35%)",
  pointerEvents: "none",
};

const bar: React.CSSProperties = {
  pointerEvents: "auto",
  width: "100%",
  maxWidth: 900,
  border: "1px solid #e5e7eb",
  background: "#fff",
  borderRadius: 18,
  padding: 8,
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 8,
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
};

const tab = (active: boolean): React.CSSProperties => ({
  height: 62, // ✅ 터치 영역
  borderRadius: 14,
  border: active ? "2px solid #111" : "1px solid #e5e7eb",
  background: active ? "#111" : "#fff",
  color: active ? "#fff" : "#111",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  gap: 2,
  fontWeight: 950,
});

const icon = (_active: boolean): React.CSSProperties => ({
  fontSize: 18,
  lineHeight: 1,
});

const label = (_active: boolean): React.CSSProperties => ({
  fontSize: 15, // ✅ 글자 크게
});