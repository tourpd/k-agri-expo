"use client";

import React from "react";
import Link from "next/link";
import type { BoothPublic as BaseBoothPublic } from "@/lib/expoPublic";
import { sendExpoLog } from "@/lib/expoLog";

type BoothPublic = BaseBoothPublic & {
  booth_id: string;
  name?: string | null;
  region?: string | null;
  category_primary?: string | null;
  intro?: string | null;
  logo_url?: string | null;
  is_verified?: boolean | null;
  listing_market?: string | null;
  revenue_range?: string | null;
  website_url?: string | null;
  youtube_url?: string | null;
  shop_url?: string | null;
  phone?: string | null;
  email?: string | null;
};

export default function BoothCardClient({ booth }: { booth: BoothPublic }) {
  const title = booth.name ?? "부스";
  const regionText = booth.region ?? "지역 미입력";
  const catText = booth.category_primary ?? "카테고리 미입력";
  const intro = booth.intro ?? "한 줄 소개가 아직 없습니다.";

  const telHref = booth.phone ? `tel:${booth.phone.replace(/\s+/g, "")}` : null;
  const mailHref = booth.email ? `mailto:${booth.email}` : null;

  async function handleBoothClick() {
    await sendExpoLog({
      event_type: "booth_click",
      target_type: "booth",
      target_id: booth.booth_id,
      booth_id: booth.booth_id,
      meta: {
        name: booth.name ?? null,
        region: booth.region ?? null,
        category_primary: booth.category_primary ?? null,
      },
    });
  }

  function stopLinkNav(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  async function handleExternalClick(
    e: React.MouseEvent,
    kind: "website" | "youtube" | "shop" | "phone" | "email"
  ) {
    stopLinkNav(e);

    await sendExpoLog({
      event_type: "booth_click",
      target_type: "booth",
      target_id: booth.booth_id,
      booth_id: booth.booth_id,
      meta: {
        click_kind: kind,
        name: booth.name ?? null,
      },
    });
  }

  return (
    <Link
      href={`/expo/booths/${booth.booth_id}`}
      onClick={handleBoothClick}
      style={{ ...card, textDecoration: "none", color: "#111", display: "block" }}
    >
      <div style={headerRow}>
        {booth.logo_url ? (
          <img src={booth.logo_url} alt={title} style={logo} />
        ) : (
          <div style={logoPlaceholder}>{title.slice(0, 1)}</div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={titleRow}>
            {title}

            {booth.is_verified ? (
              <span style={badgeVerified}>✔ VERIFIED</span>
            ) : null}

            {booth.listing_market ? (
              <span style={badgeListed}>{booth.listing_market}</span>
            ) : null}

            {booth.revenue_range ? (
              <span style={badgeRevenue}>{booth.revenue_range}</span>
            ) : null}
          </div>

          <div style={subInfo}>
            {regionText} · {catText}
          </div>
        </div>
      </div>

      <div style={introText}>{intro}</div>

      <div style={externalRow}>
        {booth.website_url ? (
          <a
            href={booth.website_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => handleExternalClick(e, "website")}
            style={btnGhostSm}
          >
            🌐 홈페이지
          </a>
        ) : null}

        {booth.youtube_url ? (
          <a
            href={booth.youtube_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => handleExternalClick(e, "youtube")}
            style={btnGhostSm}
          >
            ▶ 유튜브
          </a>
        ) : null}

        {booth.shop_url ? (
          <a
            href={booth.shop_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => handleExternalClick(e, "shop")}
            style={btnGhostSm}
          >
            🛒 쇼핑몰
          </a>
        ) : null}
      </div>

      <div style={actionRow}>
        {telHref ? (
          <a
            href={telHref}
            onClick={(e) => handleExternalClick(e, "phone")}
            style={btnPrimarySm}
          >
            📞 전화
          </a>
        ) : (
          <span style={btnDisabledSm}>📞 없음</span>
        )}

        {mailHref ? (
          <a
            href={mailHref}
            onClick={(e) => handleExternalClick(e, "email")}
            style={btnGhostSm}
          >
            ✉️ 이메일
          </a>
        ) : (
          <span style={btnDisabledSm}>✉️ 없음</span>
        )}

        <span style={btnMini}>부스 상세</span>
      </div>
    </Link>
  );
}

const card: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 18,
  padding: 16,
  background: "#fff",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const headerRow: React.CSSProperties = {
  display: "flex",
  gap: 14,
  alignItems: "center",
};

const logo: React.CSSProperties = {
  width: 70,
  height: 70,
  objectFit: "contain",
  borderRadius: 14,
  border: "1px solid #eee",
  background: "#fff",
};

const logoPlaceholder: React.CSSProperties = {
  width: 70,
  height: 70,
  borderRadius: 14,
  background: "#111",
  color: "#fff",
  fontWeight: 900,
  fontSize: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const titleRow: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 950,
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  alignItems: "center",
};

const subInfo: React.CSSProperties = {
  fontSize: 13,
  color: "#666",
  marginTop: 4,
};

const introText: React.CSSProperties = {
  marginTop: 12,
  fontSize: 14,
  lineHeight: 1.6,
  color: "#333",
};

const externalRow: React.CSSProperties = {
  marginTop: 12,
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const actionRow: React.CSSProperties = {
  marginTop: 14,
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const badgeVerified: React.CSSProperties = {
  background: "#111",
  color: "#fff",
  fontSize: 11,
  fontWeight: 900,
  padding: "4px 8px",
  borderRadius: 999,
};

const badgeListed: React.CSSProperties = {
  background: "#e0f2fe",
  color: "#0369a1",
  fontSize: 11,
  fontWeight: 900,
  padding: "4px 8px",
  borderRadius: 999,
};

const badgeRevenue: React.CSSProperties = {
  background: "#fef3c7",
  color: "#92400e",
  fontSize: 11,
  fontWeight: 900,
  padding: "4px 8px",
  borderRadius: 999,
};

const btnPrimarySm: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 900,
  fontSize: 13,
  textDecoration: "none",
};

const btnGhostSm: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
  color: "#111",
  fontWeight: 900,
  fontSize: 13,
  textDecoration: "none",
};

const btnDisabledSm: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid #eee",
  background: "#f3f4f6",
  color: "#9ca3af",
  fontWeight: 900,
  fontSize: 13,
};

const btnMini: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
  fontWeight: 900,
  fontSize: 13,
};