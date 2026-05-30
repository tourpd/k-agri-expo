import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function money(v: unknown) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "";
  return `${v.toLocaleString("ko-KR")}원`;
}

async function getProducts() {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("expo_products")
    .select("*")
    .eq("is_active", true)
    .not("name", "ilike", "%입점권%")
    .not("name", "ilike", "%부스%")
    .not("name", "ilike", "%배너%")
    .not("name", "ilike", "%슬롯%")
    .not("title", "ilike", "%입점권%")
    .not("title", "ilike", "%부스%")
    .not("title", "ilike", "%배너%")
    .not("title", "ilike", "%슬롯%")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export default async function ExpoProductsPage() {
  const products = await getProducts();

  return (
    <main style={S.page}>
      <section style={S.header}>
        <div style={S.kicker}>K-AGRI EXPO</div>
        <h1 style={S.title}>농민 특가 상품</h1>
        <p style={S.desc}>
          지금 농가에 필요한 제품을 한눈에 보고 신청할 수 있습니다.
        </p>
      </section>

      {products.length === 0 ? (
        <div style={S.empty}>등록된 농민 상품이 없습니다.</div>
      ) : (
        <section style={S.grid}>
          {products.map((p: any) => {
            const productId = String(p.product_id || p.id || "");
            const name = p.name || p.title || "상품명 없음";
            const imageUrl =
              p.image_file_url || p.image_url || p.thumbnail_url || "";

            const originPrice =
              typeof p.price_krw === "number" ? p.price_krw : null;

            const salePrice =
              typeof p.sale_price_krw === "number" ? p.sale_price_krw : null;

            const displayPrice = salePrice ?? originPrice;

            const discount =
              originPrice && salePrice && salePrice < originPrice
                ? Math.round(((originPrice - salePrice) / originPrice) * 100)
                : null;

            return (
              <Link
                key={productId}
                href={`/expo/product/${productId}`}
                style={S.card}
              >
                <div style={S.imageBox}>
                  {imageUrl ? (
                    <img src={imageUrl} alt={name} style={S.image} />
                  ) : (
                    <div style={S.noImage}>이미지 준비 중</div>
                  )}
                </div>

                <div style={S.body}>
                  {discount !== null ? (
                    <div style={S.badge}>{discount}% 할인</div>
                  ) : (
                    <div style={S.badgeGreen}>EXPO 특가</div>
                  )}

                  <h2 style={S.name}>{name}</h2>

                  <p style={S.headline}>
                    {p.headline_text ||
                      p.usage_summary ||
                      "농가 상황에 맞춰 상담 후 안내드립니다."}
                  </p>

                  <div style={S.priceRow}>
                    <div>
                      <div style={S.price}>
                        {displayPrice ? money(displayPrice) : "가격 문의"}
                      </div>

                      {discount !== null ? (
                        <div style={S.oldPrice}>{money(originPrice)}</div>
                      ) : null}
                    </div>

                    <div style={S.cta}>상세 보기</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 980,
    margin: "0 auto",
    padding: "20px 14px 48px",
    background: "#f8fafc",
  },
  header: {
    background: "#fff",
    borderRadius: 24,
    padding: 24,
    border: "1px solid #e5e7eb",
    marginBottom: 18,
  },
  kicker: {
    fontSize: 13,
    fontWeight: 950,
    color: "#16a34a",
  },
  title: {
    margin: "8px 0",
    fontSize: 36,
    fontWeight: 950,
    color: "#111827",
  },
  desc: {
    margin: 0,
    fontSize: 18,
    lineHeight: 1.7,
    color: "#475569",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 16,
  },
  card: {
    display: "grid",
    gridTemplateColumns: "180px 1fr",
    gap: 18,
    background: "#fff",
    borderRadius: 24,
    padding: 18,
    border: "1px solid #e5e7eb",
    textDecoration: "none",
    color: "#111827",
    boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
  },
  imageBox: {
    width: 180,
    height: 180,
    borderRadius: 20,
    border: "1px solid #e5e7eb",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    padding: 14,
    boxSizing: "border-box",
  },
  noImage: {
    color: "#94a3b8",
    fontWeight: 900,
    textAlign: "center",
  },
  body: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  badge: {
    display: "inline-flex",
    width: "fit-content",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#fee2e2",
    color: "#b91c1c",
    fontSize: 14,
    fontWeight: 950,
    marginBottom: 10,
  },
  badgeGreen: {
    display: "inline-flex",
    width: "fit-content",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#dcfce7",
    color: "#166534",
    fontSize: 14,
    fontWeight: 950,
    marginBottom: 10,
  },
  name: {
    margin: "0 0 8px",
    fontSize: 28,
    fontWeight: 950,
    lineHeight: 1.25,
  },
  headline: {
    margin: "0 0 14px",
    fontSize: 17,
    lineHeight: 1.6,
    color: "#334155",
    fontWeight: 800,
    wordBreak: "keep-all",
  },
  priceRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  price: {
    fontSize: 30,
    fontWeight: 950,
    color: "#dc2626",
  },
  oldPrice: {
    marginTop: 4,
    fontSize: 16,
    color: "#94a3b8",
    textDecoration: "line-through",
    fontWeight: 900,
  },
  cta: {
    minWidth: 120,
    height: 52,
    borderRadius: 14,
    background: "#16a34a",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 950,
  },
  empty: {
    padding: 28,
    borderRadius: 20,
    background: "#fff",
    border: "1px solid #e5e7eb",
    color: "#64748b",
    fontSize: 18,
    fontWeight: 900,
  },
};