import React from "react";
import Link from "next/link";
import type { ExpoHomeDealItem } from "@/lib/expo/home-deals";

function formatDeadline(v?: string | null) {
  if (!v) return "마감일 미정";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "마감일 미정";
  return `${d.toLocaleDateString("ko-KR")} ${d.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  })} 마감`;
}

export default function ExpoDealsSection({
  items,
}: {
  items: ExpoHomeDealItem[];
}) {
  if (!items || items.length === 0) return null;

  return (
    <section style={S.section} className="expo-section">
      <div style={S.head}>
        <div>
          <div style={S.kicker}>EXPO DEALS</div>
          <h2 style={S.title}>🔥 오늘의 특가</h2>
          <div style={S.desc}>
            마감 임박, 최근 등록, 활성 상태를 기준으로 자동 노출되는 특가입니다.
          </div>
        </div>

        <Link href="/expo/deals" style={S.moreBtn}>
          전체 특가 보기
        </Link>
      </div>

      <div style={S.grid}>
        {items.map((item) => (
          <Link
            key={item.deal_id}
            href={`/expo/deals/${item.deal_id}`}
            style={S.card}
          >
            <div style={S.topRow}>
              <div style={S.badge}>EXPO 특가</div>
              <div style={S.booth}>{item.booth_name || "참가 부스"}</div>
            </div>

            <div style={S.cardTitle}>{item.title || "특가 제목 없음"}</div>

            <div style={S.cardDesc}>
              {item.description || "지금 확인해 보셔야 할 행사 특가입니다."}
            </div>

            <div style={S.priceWrap}>
              <div style={S.regularPrice}>{item.regular_price_text || "-"}</div>
              <div style={S.arrow}>→</div>
              <div style={S.expoPrice}>{item.expo_price_text || "-"}</div>
            </div>

            <div style={S.meta}>
              <span>{item.stock_text || "수량 문의"}</span>
              <span>{formatDeadline(item.deadline_at)}</span>
            </div>

            <div style={S.cta}>특가 보러가기 →</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  section: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "28px 24px 0",
  },
  head: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 16,
    flexWrap: "wrap",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
    letterSpacing: 0.4,
  },
  title: {
    margin: "8px 0 0",
    fontSize: "clamp(28px, 5vw, 36px)",
    fontWeight: 950,
    color: "#0f172a",
  },
  desc: {
    marginTop: 10,
    color: "#64748b",
    fontSize: 15,
    lineHeight: 1.8,
  },
  moreBtn: {
    textDecoration: "none",
    color: "#0f172a",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 999,
    padding: "11px 15px",
    fontWeight: 900,
  },
  grid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 14,
  },
  card: {
    display: "block",
    textDecoration: "none",
    color: "#0f172a",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 12px 24px rgba(15,23,42,0.05)",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  badge: {
    display: "inline-block",
    borderRadius: 999,
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "6px 9px",
    fontSize: 11,
    fontWeight: 950,
  },
  booth: {
    fontSize: 12,
    fontWeight: 800,
    color: "#475569",
  },
  cardTitle: {
    marginTop: 14,
    fontSize: 22,
    lineHeight: 1.25,
    fontWeight: 950,
  },
  cardDesc: {
    marginTop: 10,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.7,
    minHeight: 48,
  },
  priceWrap: {
    marginTop: 16,
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  regularPrice: {
    fontSize: 14,
    color: "#94a3b8",
    textDecoration: "line-through",
    fontWeight: 800,
  },
  arrow: {
    fontWeight: 900,
    color: "#cbd5e1",
  },
  expoPrice: {
    fontSize: 24,
    color: "#dc2626",
    fontWeight: 950,
  },
  meta: {
    marginTop: 14,
    display: "grid",
    gap: 6,
    color: "#334155",
    fontSize: 13,
    fontWeight: 700,
  },
  cta: {
    marginTop: 16,
    fontWeight: 950,
    fontSize: 14,
    color: "#0f172a",
  },
};