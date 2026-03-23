"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  href: string;
  label: string;
  icon: string;
};

const TABS: Tab[] = [
  { href: "/expo", label: "지도(전시관)", icon: "🗺️" },
  { href: "/expo/deals", label: "특가", icon: "🔥" },
  { href: "/expo/entry", label: "입장등록", icon: "📝" },
];

export default function ExpoTabs() {
  const pathname = usePathname();

  // ✅ 입장등록(/expo/entry)에서는 탭을 숨긴다 (클릭/submit 가로채기 원천 차단)
  if (pathname === "/expo/entry") return null;

  return (
    <div style={wrap} aria-hidden="true">
      <nav style={bar} aria-label="Expo navigation">
        {TABS.map((t) => {
          const active = isActive(pathname, t.href);
          return (
            <Link key={t.href} href={t.href} style={tabBtn(active)}>
              <div style={tabIcon(active)}>{t.icon}</div>
              <div style={tabLabel(active)}>{t.label}</div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/expo") return pathname === "/expo";
  return pathname.startsWith(href);
}

const BAR_H = 68;

const wrap: React.CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 9999,

  display: "flex",
  justifyContent: "center",
  padding: "10px 10px calc(env(safe-area-inset-bottom, 0px) + 10px)",

  // ✅ wrap은 클릭 가로채지 않게 (탭 영역 외 투명부 클릭 통과)
  pointerEvents: "none",
};

const bar: React.CSSProperties = {
  // ✅ 실제 탭 버튼만 클릭 가능
  pointerEvents: "auto",

  width: "100%",
  maxWidth: 900,

  height: BAR_H,
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 10,

  borderRadius: 18,
  border: "1px solid #e5e7eb",
  background: "rgba(255,255,255,0.95)",
  backdropFilter: "blur(8px)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  padding: 10,
};

const tabBtn = (active: boolean): React.CSSProperties => ({
  textDecoration: "none",
  color: active ? "#111" : "#6b7280",
  borderRadius: 16,
  border: active ? "1px solid #111" : "1px solid #e5e7eb",
  background: active ? "#111" : "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontWeight: 950,
  userSelect: "none",
});

const tabIcon = (active: boolean): React.CSSProperties => ({
  fontSize: 18,
  lineHeight: 1,
  filter: active ? "none" : "grayscale(0.2)",
});

const tabLabel = (active: boolean): React.CSSProperties => ({
  fontSize: 14,
  fontWeight: 950,
  color: active ? "#fff" : "#111",
  opacity: active ? 1 : 0.9,
});