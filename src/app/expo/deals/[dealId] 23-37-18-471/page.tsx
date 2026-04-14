import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicDeal } from "@/lib/expoPublic";

export const dynamic = "force-dynamic";

function safe(v: any, fallback: string) {
  const s = typeof v === "string" ? v : "";
  return s.trim() ? s : fallback;
}

function formatDeadline(v: string | null) {
  if (!v) return "기간 한정";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "기간 한정";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")} 마감`;
}

export default async function ExpoDealDetailPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = await params;
  const { deal, booth } = await getPublicDeal(dealId);

  if (!deal) notFound();

  const title = safe(deal.title, "EXPO 특가");
  const desc = safe(deal.description, "행사 특가 상품입니다.");
  const regular = safe(deal.regular_price_text, "정가 문의");
  const expo = safe(deal.expo_price_text, "EXPO 특가 문의");
  const stock = safe(deal.stock_text, "수량 한정");
  const deadline = formatDeadline(deal.deadline_at ?? null);

  return (
    <main style={S.page}>
      <div style={S.container}>
        <div style={S.badge}>EXPO LIMITED DROP</div>

        <h1 style={S.title}>{title}</h1>
        <div style={S.desc}>{desc}</div>

        <div style={S.priceCard}>
          <div style={S.regularPrice}>{regular}</div>
          <div style={S.expoPrice}>{expo}</div>
          <div style={S.stock}>{stock}</div>
          <div style={S.deadline}>{deadline}</div>
        </div>

        <div style={S.actions}>
          {deal.buy_url ? (
            <a
              href={deal.buy_url}
              target="_blank"
              rel="noopener noreferrer"
              style={S.btnPrimary}
            >
              구매하기 →
            </a>
          ) : null}

          {booth?.booth_id ? (
            <Link href={`/expo/booths/${booth.booth_id}`} style={S.btnGhost}>
              부스 보러가기
            </Link>
          ) : null}

          {deal.product_id ? (
            <Link href={`/expo/product/${deal.product_id}`} style={S.btnGhost}>
              연결 제품 보기
            </Link>
          ) : null}

          <Link href="/expo/deals" style={S.btnGhost}>
            전체 특가
          </Link>
        </div>

        {booth ? (
          <div style={S.boothCard}>
            <div style={S.boothTitle}>{safe(booth.name, "참가 부스")}</div>
            <div style={S.boothDesc}>{safe(booth.intro, "부스 소개가 준비 중입니다.")}</div>
          </div>
        ) : null}
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
    maxWidth: 900,
    margin: "0 auto",
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
  title: {
    marginTop: 16,
    fontSize: 38,
    fontWeight: 950,
    lineHeight: 1.2,
    color: "#111",
  },
  desc: {
    marginTop: 12,
    fontSize: 15,
    color: "#444",
    lineHeight: 1.8,
  },
  priceCard: {
    marginTop: 24,
    border: "1px solid #eee",
    borderRadius: 20,
    padding: 22,
    background: "#fffaf5",
  },
  regularPrice: {
    fontSize: 16,
    color: "#777",
    textDecoration: "line-through",
  },
  expoPrice: {
    marginTop: 8,
    fontSize: 30,
    fontWeight: 950,
    color: "#dc2626",
  },
  stock: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: 900,
    color: "#111",
  },
  deadline: {
    marginTop: 6,
    fontSize: 14,
    color: "#92400e",
    fontWeight: 800,
  },
  actions: {
    marginTop: 20,
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
  boothCard: {
    marginTop: 28,
    border: "1px solid #eee",
    borderRadius: 18,
    padding: 18,
    background: "#fafafa",
  },
  boothTitle: {
    fontSize: 22,
    fontWeight: 950,
    color: "#111",
  },
  boothDesc: {
    marginTop: 10,
    fontSize: 14,
    color: "#555",
    lineHeight: 1.8,
  },
};