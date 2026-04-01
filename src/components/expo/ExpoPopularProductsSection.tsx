import React from "react";
import Link from "next/link";

type PopularProduct = {
  id: string;
  rank: number;
  title: string;
  subtitle?: string | null;
  reason?: string | null;
  link_url: string;
};

export default function ExpoPopularProductsSection({
  items,
}: {
  items: PopularProduct[];
}) {
  return (
    <section style={S.sectionWrap} className="expo-section">
      <div style={S.headerRow}>
        <div>
          <div style={S.eyebrow}>POPULAR PRODUCTS</div>
          <h2 style={S.title}>농민이 선택한 인기제품</h2>
          <p style={S.subtitle}>
            최근 클릭, 상담, 구매 데이터를 바탕으로 많이 선택된 제품입니다.
          </p>
        </div>

        <Link href="/expo/booths" style={S.moreLink}>
          전체 보기 →
        </Link>
      </div>

      {items.length === 0 ? (
        <div style={S.emptyBox}>아직 집계된 인기제품 데이터가 없습니다.</div>
      ) : (
        <div style={S.grid}>
          {items.map((item) => (
            <div key={item.id} style={S.card}>
              <div style={S.rankBadge}>{item.rank}위</div>
              <div style={S.name}>{item.title}</div>
              {item.subtitle ? <div style={S.sub}>{item.subtitle}</div> : null}
              {item.reason ? <div style={S.reason}>{item.reason}</div> : null}

              <Link href={item.link_url} style={S.btn}>
                자세히 보기 →
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  sectionWrap: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "28px 24px 0",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
    letterSpacing: 0.4,
  },
  title: {
    margin: "8px 0 0",
    fontSize: "clamp(28px, 4vw, 40px)",
    lineHeight: 1.1,
    fontWeight: 950,
    letterSpacing: -0.8,
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    color: "#64748b",
    lineHeight: 1.8,
  },
  moreLink: {
    textDecoration: "none",
    color: "#0f172a",
    fontWeight: 900,
  },
  emptyBox: {
    marginTop: 16,
    borderRadius: 18,
    padding: "18px 20px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#64748b",
  },
  grid: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
  },
  card: {
    borderRadius: 22,
    padding: 20,
    background: "#fff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 14px 34px rgba(15,23,42,0.06)",
  },
  rankBadge: {
    display: "inline-block",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 950,
    background: "#dcfce7",
    color: "#166534",
  },
  name: {
    marginTop: 16,
    fontSize: 28,
    lineHeight: 1.15,
    fontWeight: 950,
    color: "#0f172a",
  },
  sub: {
    marginTop: 10,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.7,
  },
  reason: {
    marginTop: 14,
    fontSize: 14,
    color: "#334155",
    lineHeight: 1.7,
    fontWeight: 700,
  },
  btn: {
    display: "inline-block",
    marginTop: 20,
    textDecoration: "none",
    color: "#ea580c",
    fontWeight: 900,
  },
};