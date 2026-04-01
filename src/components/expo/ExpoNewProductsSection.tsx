import React from "react";
import Link from "next/link";
import ActionLink from "@/components/expo/ActionLink";
import type { HomeSlot } from "@/types/expo-home";
import { isExternalLink, resolveLink, safeText } from "@/lib/expo/home-utils";

export default function ExpoNewProductsSection({
  items,
}: {
  items: HomeSlot[];
}) {
  return (
    <section id="new-products" style={S.sectionWrap} className="expo-section">
      <div style={S.sectionHead} className="expo-section-head">
        <div>
          <div style={S.sectionEyebrow}>NEW PRODUCTS SPOTLIGHT</div>
          <h2 style={S.sectionTitle}>⭐ 이달의 신제품</h2>
          <div style={S.sectionDesc}>
            메인에서는 과한 판매보다 박람회다운 신제품 소개 중심으로 노출합니다.
          </div>
        </div>

        <Link href="/expo/hall/new-products" style={S.moreLink}>
          전체 보기 →
        </Link>
      </div>

      <div style={S.newProductsGrid} className="expo-new-grid">
        {items.length === 0 ? (
          <>
            <div style={S.newProductCard} className="expo-new-card">
              <div style={S.newProductBadge}>NEW</div>
              <div style={S.newProductTitle}>싹쓰리충 골드</div>
              <div style={S.newProductDesc}>친환경 해충 방제 솔루션</div>
              <Link href="/expo/hall/new-products" style={S.newProductBtn}>
                자세히 보기 →
              </Link>
            </div>

            <div style={S.newProductCard} className="expo-new-card">
              <div style={S.newProductBadge}>NEW</div>
              <div style={S.newProductTitle}>메가파워칼</div>
              <div style={S.newProductDesc}>비대기 집중 관리용 고칼륨 자재</div>
              <Link href="/expo/hall/new-products" style={S.newProductBtn}>
                자세히 보기 →
              </Link>
            </div>

            <div style={S.newProductCard} className="expo-new-card">
              <div style={S.newProductBadge}>NEW</div>
              <div style={S.newProductTitle}>신형 농업 장비</div>
              <div style={S.newProductDesc}>현장 효율을 높이는 신규 전시 품목</div>
              <Link href="/expo/hall/new-products" style={S.newProductBtn}>
                자세히 보기 →
              </Link>
            </div>
          </>
        ) : (
          items.map((item) => {
            const href = resolveLink(item.link_type, item.link_value);
            const external = isExternalLink(item.link_type, item.link_value);

            return (
              <ActionLink
                key={item.id}
                href={href}
                external={external}
                style={S.newProductCard}
              >
                <div style={S.newProductBadge}>
                  {safeText(item.badge_text, "NEW")}
                </div>

                <div style={S.newProductTitle}>
                  {safeText(item.title, "이달의 신제품")}
                </div>

                <div style={S.newProductDesc}>
                  {safeText(
                    item.description || item.subtitle,
                    "신제품 설명이 아직 등록되지 않았습니다."
                  )}
                </div>

                <div style={S.newProductBtn}>
                  {safeText(item.button_text, "자세히 보기")} →
                </div>
              </ActionLink>
            );
          })
        )}
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
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-end",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
    letterSpacing: 0.4,
  },
  sectionTitle: {
    margin: "8px 0 0",
    fontSize: "clamp(26px, 5vw, 34px)",
    lineHeight: 1.1,
    fontWeight: 950,
    letterSpacing: -0.8,
  },
  sectionDesc: {
    marginTop: 10,
    fontSize: 15,
    color: "#64748b",
    lineHeight: 1.8,
  },
  moreLink: {
    textDecoration: "none",
    color: "#0f172a",
    fontWeight: 900,
    fontSize: 14,
  },
  newProductsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
  },
  newProductCard: {
    textDecoration: "none",
    color: "#0f172a",
    borderRadius: 28,
    padding: 22,
    background: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)",
    border: "1px solid #fdba74",
    boxShadow: "0 14px 34px rgba(15,23,42,0.06)",
    display: "block",
  },
  newProductBadge: {
    display: "inline-block",
    padding: "7px 10px",
    borderRadius: 999,
    background: "#fff",
    fontSize: 11,
    fontWeight: 950,
    color: "#c2410c",
  },
  newProductTitle: {
    marginTop: 18,
    fontSize: "clamp(20px, 4.6vw, 24px)",
    lineHeight: 1.15,
    fontWeight: 950,
  },
  newProductDesc: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 1.8,
    minHeight: 62,
  },
  newProductBtn: {
    display: "inline-block",
    marginTop: 16,
    textDecoration: "none",
    fontWeight: 950,
    fontSize: 14,
    color: "#c2410c",
  },
};