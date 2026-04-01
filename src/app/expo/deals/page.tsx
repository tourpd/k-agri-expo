// src/app/expo/deals/page.tsx
import Link from "next/link";
import { getPublicDeals } from "@/lib/expoPublic";

export const dynamic = "force-dynamic";

function formatDeadline(v: string | null) {
  if (!v) return "기간 한정";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "기간 한정";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")} 마감`;
}

function safe(v: any, fallback: string) {
  const s = typeof v === "string" ? v : "";
  return s.trim() ? s : fallback;
}

function cleanParam(v: string | string[] | undefined) {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

function withTrackingParams(
  href: string,
  tracking: { src?: string; campaign?: string; video?: string }
) {
  const params = new URLSearchParams();

  if (tracking.src) params.set("src", tracking.src);
  if (tracking.campaign) params.set("campaign", tracking.campaign);
  if (tracking.video) params.set("video", tracking.video);

  const qs = params.toString();
  if (!qs) return href;

  return href.includes("?") ? `${href}&${qs}` : `${href}?${qs}`;
}

export default async function ExpoDealsPage({
  searchParams,
}: {
  searchParams: Promise<{
    src?: string | string[];
    campaign?: string | string[];
    video?: string | string[];
  }>;
}) {
  const resolved = await searchParams;

  const tracking = {
    src: cleanParam(resolved?.src),
    campaign: cleanParam(resolved?.campaign),
    video: cleanParam(resolved?.video),
  };

  const deals = await getPublicDeals(50);

  return (
    <main style={S.page}>
      <div style={S.container}>
        <div style={S.top}>
          <div>
            <div style={S.kicker}>K-Agri Expo</div>
            <h1 style={S.title}>🔥 EXPO 특가</h1>
            <div style={S.sub}>행사 기간 한정 특가와 추천 상품을 한눈에 보실 수 있습니다.</div>
          </div>

          <div style={S.topActions}>
            <Link href={withTrackingParams("/expo", tracking)} style={S.btnGhost}>
              엑스포 홈
            </Link>
            <Link
              href={withTrackingParams("/expo/hall/agri-inputs", tracking)}
              style={S.btnGhost}
            >
              농자재관
            </Link>
          </div>
        </div>

        {deals.length === 0 ? (
          <div style={S.empty}>등록된 EXPO 특가가 없습니다.</div>
        ) : (
          <div style={S.grid}>
            {deals.map((deal) => {
              const dealId = String(deal.deal_id);
              const boothId = String(deal.booth_id);

              const title = safe(deal.title, "EXPO 특가");
              const desc = safe(deal.description, "행사 특가 상품입니다.");
              const regular = safe(deal.regular_price_text, "정가 문의");
              const expo = safe(deal.expo_price_text, "EXPO 특가 문의");
              const stock = safe(deal.stock_text, "수량 한정");
              const deadline = formatDeadline(deal.deadline_at ?? null);

              const buyUrl = deal.buy_url ? String(deal.buy_url) : null;

              const dealDetailHref = withTrackingParams(`/expo/deals/${dealId}`, tracking);
              const boothHref = withTrackingParams(`/expo/booths/${boothId}`, tracking);
              const productHref = deal.product_id
                ? withTrackingParams(`/expo/product/${deal.product_id}`, tracking)
                : null;

              const MainLink = buyUrl ? (
                <a
                  href={buyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={S.btnPrimary}
                >
                  구매하기 →
                </a>
              ) : (
                <Link href={dealDetailHref} style={S.btnPrimary}>
                  상세 보기 →
                </Link>
              );

              return (
                <article key={dealId} style={S.card}>
                  <div style={S.badge}>EXPO LIMITED DROP</div>

                  <h2 style={S.cardTitle}>{title}</h2>

                  <div style={S.meta}>
                    {deal.booth_name ?? "부스"} · {deal.booth_region ?? "지역 미입력"} ·{" "}
                    {deal.booth_category_primary ?? "카테고리 미입력"}
                  </div>

                  <div style={S.desc}>{desc}</div>

                  <div style={S.priceWrap}>
                    <div style={S.regularPrice}>{regular}</div>
                    <div style={S.expoPrice}>{expo}</div>
                  </div>

                  <div style={S.stock}>{stock}</div>
                  <div style={S.deadline}>{deadline}</div>

                  <div style={S.actions}>
                    {MainLink}

                    <Link href={boothHref} style={S.btnGhost}>
                      부스 보러가기
                    </Link>

                    {productHref ? (
                      <Link href={productHref} style={S.btnGhost}>
                        제품 보기
                      </Link>
                    ) : (
                      <span style={S.btnDisabled}>제품 연결 예정</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#fff",
    padding: "28px 16px 40px",
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
  },
  top: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-end",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  kicker: {
    fontSize: 12,
    fontWeight: 900,
    color: "#ef4444",
  },
  title: {
    margin: "6px 0 0",
    fontSize: 34,
    fontWeight: 950,
  },
  sub: {
    marginTop: 8,
    color: "#666",
    fontSize: 14,
    lineHeight: 1.6,
  },
  topActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))",
    gap: 14,
  },
  card: {
    border: "1px solid #eee",
    borderRadius: 18,
    padding: 18,
    background: "#fffaf5",
  },
  badge: {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 950,
    color: "#b45309",
    background: "#ffedd5",
    border: "1px solid #fdba74",
    borderRadius: 999,
    padding: "6px 10px",
  },
  cardTitle: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: 950,
    lineHeight: 1.25,
  },
  meta: {
    marginTop: 8,
    fontSize: 13,
    color: "#666",
    lineHeight: 1.6,
  },
  desc: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 1.7,
    color: "#222",
  },
  priceWrap: {
    marginTop: 18,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  regularPrice: {
    fontSize: 14,
    color: "#777",
    textDecoration: "line-through",
  },
  expoPrice: {
    fontSize: 24,
    fontWeight: 950,
    color: "#dc2626",
  },
  stock: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: 900,
    color: "#111",
  },
  deadline: {
    marginTop: 6,
    fontSize: 13,
    color: "#92400e",
    fontWeight: 800,
  },
  actions: {
    marginTop: 18,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  btnPrimary: {
    padding: "12px 16px",
    background: "#111",
    color: "#fff",
    borderRadius: 12,
    fontWeight: 900,
    textDecoration: "none",
    display: "inline-block",
  },
  btnGhost: {
    padding: "12px 16px",
    border: "1px solid #ddd",
    borderRadius: 12,
    background: "#fff",
    color: "#111",
    fontWeight: 900,
    textDecoration: "none",
    display: "inline-block",
  },
  btnDisabled: {
    padding: "12px 16px",
    borderRadius: 12,
    background: "#eee",
    color: "#999",
    fontWeight: 900,
    display: "inline-block",
  },
  empty: {
    marginTop: 24,
    padding: 24,
    borderRadius: 16,
    background: "#fafafa",
    color: "#666",
  },
};