import React from "react";
import ActionLink from "@/components/expo/ActionLink";
import type { HomeSlot } from "@/types/expo-home";
import { isExternalLink, resolveLink, safeText } from "@/lib/expo/home-utils";

export default function ExpoMainEventSection({
  item,
}: {
  item: HomeSlot | null;
}) {
  const href = resolveLink(item?.link_type, item?.link_value);
  const external = isExternalLink(item?.link_type, item?.link_value);

  return (
    <section id="event" style={S.sectionWrap} className="expo-section">
      <div style={S.promoCardWarmFull} className="expo-promo-card">
        <div style={S.promoBadge}>
          {safeText(item?.badge_text, "🎁 이달의 경품 이벤트")}
        </div>

        <h2 style={S.promoTitleFull}>
          {safeText(item?.title, "이달의 경품 이벤트")}
        </h2>

        <div style={S.promoPriceFull}>
          {safeText(item?.price_text, "참여만 해도 혜택")}
        </div>

        <p style={S.promoDescFull}>
          {safeText(
            item?.description,
            "경품 이벤트는 메인의 관심을 끌고, 참여를 유도하는 대표 진입 장치입니다."
          )}
        </p>

        <div style={S.promoButtons} className="expo-promo-buttons">
          <ActionLink href={href} external={external} style={S.promoBtnPrimary}>
            {safeText(item?.button_text, "이벤트 참여하기")} →
          </ActionLink>
        </div>
      </div>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  sectionWrap: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "28px 24px 0",
  },
  promoCardWarmFull: {
    borderRadius: 34,
    padding: 30,
    background: "linear-gradient(135deg, #111827 0%, #1f2937 55%, #9a3412 100%)",
    color: "#fff",
  },
  promoBadge: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: 12,
    fontWeight: 950,
  },
  promoTitleFull: {
    margin: "18px 0 0",
    fontSize: "clamp(28px, 6vw, 42px)",
    lineHeight: 1.08,
    fontWeight: 950,
    letterSpacing: -1,
  },
  promoPriceFull: {
    marginTop: 14,
    fontSize: "clamp(24px, 5vw, 34px)",
    fontWeight: 950,
    color: "#fde68a",
  },
  promoDescFull: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 1.9,
    color: "rgba(255,255,255,0.9)",
    maxWidth: 960,
  },
  promoButtons: {
    marginTop: 24,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  promoBtnPrimary: {
    textDecoration: "none",
    background: "#fff",
    color: "#0f172a",
    padding: "14px 18px",
    borderRadius: 16,
    fontWeight: 950,
  },
};