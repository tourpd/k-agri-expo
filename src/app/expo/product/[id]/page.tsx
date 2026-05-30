import type { CSSProperties } from "react";
import ProductOrderBox from "@/components/expo/product/ProductOrderBox";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ id: string }>;
};

function money(v: unknown) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "";
  return `${v.toLocaleString("ko-KR")}원`;
}

function isImageUrl(url?: string | null) {
  if (!url) return false;
  return /\.(png|jpg|jpeg|webp|gif|avif)(\?.*)?$/i.test(url);
}

function toEmbedUrl(url: string) {
  if (!url) return "";
  if (url.includes("watch?v=")) return url.replace("watch?v=", "embed/");

  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0];
    return id ? `https://www.youtube.com/embed/${id}` : "";
  }

  if (url.includes("/shorts/")) {
    const id = url.split("/shorts/")[1]?.split("?")[0];
    return id ? `https://www.youtube.com/embed/${id}` : "";
  }

  return url;
}

async function getProduct(id: string) {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("expo_products")
    .select("*")
    .eq("product_id", id)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  let product: any = null;

  try {
    product = await getProduct(id);
  } catch {
    return (
      <main style={S.page}>
        <div style={S.errorBox}>
          제품 정보를 불러오는 중 오류가 발생했습니다.
          <br />
          관리자에게 product_id를 확인해 주세요.
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main style={S.page}>
        <div style={S.errorBox}>제품을 찾을 수 없습니다.</div>
      </main>
    );
  }

  const productId = String(product.product_id ?? id);
  const boothId = String(product.booth_id ?? "");
  const name = product.name || product.title || "제품명 없음";

  const imageUrl =
    product.image_file_url || product.image_url || product.thumbnail_url || "";

  const labelImageUrl = product.label_image_url || "";
  const manualFileUrl =
    product.manual_file_url || product.catalog_file_url || product.catalog_url || "";
  const manualFileName =
    product.manual_file_name || product.catalog_filename || "사용설명서 / 카탈로그";

  const originPrice =
    typeof product.price_krw === "number" ? product.price_krw : null;

  const salePrice =
    typeof product.sale_price_krw === "number" ? product.sale_price_krw : null;

  const displayPrice = salePrice ?? originPrice;

  const discount =
    originPrice && salePrice && salePrice < originPrice
      ? Math.round(((originPrice - salePrice) / originPrice) * 100)
      : null;

  const headline =
    product.headline_text ||
    product.usage_summary ||
    "농가 상황에 맞춰 상담 후 안내드립니다.";

  const promoTitle = `${name} 신청`;
  const promoReason =
    product.headline_text ||
    product.usage_summary ||
    `${name} 제품 상담 및 주문 신청`;

  const promoCondition = "신청 후 담당자가 확인 연락드립니다.";

  const embedUrl = toEmbedUrl(product.youtube_url || "");

  return (
    <main style={S.page}>
      <section style={S.heroCard}>
        <div style={S.badge}>K-Agri Expo 농민 신청 상품</div>

        <div style={S.heroGrid}>
          <div style={S.imageBox}>
            {imageUrl ? (
              <img src={imageUrl} alt={name} style={S.mainImage} />
            ) : (
              <div style={S.noImage}>제품 이미지 준비 중</div>
            )}
          </div>

          <div style={S.heroText}>
            <h1 style={S.title}>{name}</h1>
            <p style={S.headline}>{headline}</p>

            {product.usage_summary ? (
              <div style={S.useBox}>
                <b>간단 사용 기준</b>
                <span>{product.usage_summary}</span>
              </div>
            ) : (
              <div style={S.useBox}>
                <b>사용 안내</b>
                <span>자세한 사용법은 제품 라벨 또는 상담으로 안내드립니다.</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section style={S.actionCard}>
        <div style={S.priceBox}>
          <div style={S.priceLabel}>EXPO 신청가</div>

          <div style={S.price}>
            {displayPrice ? money(displayPrice) : "가격 문의"}
          </div>

          {discount !== null ? (
            <>
              <div style={S.oldPrice}>{money(originPrice)}</div>
              <div style={S.discount}>{discount}% 할인</div>
            </>
          ) : null}

          <div style={S.priceNote}>신청 후 담당자가 확인 연락드립니다.</div>
        </div>

        <ProductOrderBox
          productId={productId}

  boothId={boothId}

  productName={name}

  purchaseUrl=""

  ctaText="신청하기"

  promoType="trial"

  promoTitle={promoTitle}

  promoReason={promoReason}

  promoCondition={promoCondition}

  priceKrw={originPrice}

  salePriceKrw={salePrice}

  coveragePerUnit={product.coverage_per_unit}
        />
      </section>

      <section style={S.labelCard}>
        <h2 style={S.sectionTitle}>제품 라벨 / 사용법</h2>

        {labelImageUrl ? (
          <div style={S.labelImageWrap}>
            <img src={labelImageUrl} alt={`${name} 제품 라벨`} style={S.labelImage} />
          </div>
        ) : (
          <div style={S.guideBox}>
            제품 라벨 이미지가 아직 등록되지 않았습니다.
            <br />
            신청하시면 담당자가 사용법을 확인해 안내드립니다.
          </div>
        )}
      </section>

      {manualFileUrl ? (
        <section style={S.detailCard}>
          <h2 style={S.sectionTitle}>사용설명서 / 카탈로그</h2>

          {isImageUrl(manualFileUrl) ? (
            <div style={S.labelImageWrap}>
              <img src={manualFileUrl} alt={manualFileName} style={S.labelImage} />
            </div>
          ) : (
            <a href={manualFileUrl} target="_blank" rel="noreferrer" style={S.manualBtn}>
              {manualFileName} 보기
            </a>
          )}
        </section>
      ) : null}

      {product.description ? (
        <section style={S.detailCard}>
          <h2 style={S.sectionTitle}>제품 설명</h2>
          <p style={S.text}>{product.description}</p>
        </section>
      ) : null}

      {embedUrl ? (
        <section style={S.detailCard}>
          <h2 style={S.sectionTitle}>제품 영상</h2>
          <iframe
            src={embedUrl}
            width="100%"
            height="360"
            style={S.iframe}
            allowFullScreen
            title={name}
          />
        </section>
      ) : null}

      <section style={S.consultCard}>
        <h2 style={S.consultTitle}>정확한 사용량은 상담으로 안내드립니다</h2>
        <p style={S.consultText}>
          작물, 재배 면적, 생육 상태, 병해충 상황에 따라 사용 기준이 달라질 수 있습니다.
          위의 <b>신청하기</b>를 남기시면 담당자가 확인 후 연락드립니다.
        </p>
      </section>
    </main>
  );
}

const S: Record<string, CSSProperties> = {
  page: {
    maxWidth: 760,
    margin: "0 auto",
    padding: "18px 14px 40px",
    background: "#f8fafc",
  },

  heroCard: {
    background: "#fff",
    borderRadius: 24,
    padding: 20,
    border: "1px solid #e5e7eb",
    boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
    marginBottom: 16,
  },

  badge: {
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: 999,
    background: "#fee2e2",
    color: "#b91c1c",
    fontSize: 15,
    fontWeight: 950,
    marginBottom: 14,
  },

  heroGrid: {
    display: "grid",
    gridTemplateColumns: "180px 1fr",
    gap: 18,
    alignItems: "center",
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
    flexShrink: 0,
  },

  mainImage: {
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

  heroText: {
    minWidth: 0,
  },

  title: {
    margin: "0 0 10px",
    fontSize: 34,
    fontWeight: 950,
    lineHeight: 1.2,
    color: "#0f172a",
    wordBreak: "keep-all",
  },

  headline: {
    margin: "0 0 14px",
    fontSize: 20,
    fontWeight: 900,
    lineHeight: 1.5,
    color: "#111827",
    wordBreak: "keep-all",
  },

  useBox: {
    display: "grid",
    gap: 6,
    padding: 14,
    borderRadius: 16,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1e3a8a",
    fontSize: 16,
    lineHeight: 1.6,
    wordBreak: "keep-all",
  },

  actionCard: {
    background: "#fff",
    borderRadius: 24,
    padding: 20,
    border: "2px solid #bbf7d0",
    boxShadow: "0 10px 28px rgba(22,163,74,0.12)",
    marginBottom: 16,
  },

  priceBox: {
    textAlign: "center",
    paddingBottom: 18,
    marginBottom: 18,
    borderBottom: "1px solid #e5e7eb",
  },

  priceLabel: {
    fontSize: 16,
    fontWeight: 950,
    color: "#16a34a",
    marginBottom: 6,
  },

  price: {
    fontSize: 42,
    fontWeight: 950,
    color: "#dc2626",
    lineHeight: 1.1,
  },

  oldPrice: {
    marginTop: 6,
    fontSize: 20,
    color: "#94a3b8",
    textDecoration: "line-through",
    fontWeight: 900,
  },

  discount: {
    marginTop: 4,
    fontSize: 20,
    color: "#dc2626",
    fontWeight: 950,
  },

  priceNote: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: 800,
    color: "#475569",
  },

  labelCard: {
    background: "#fff",
    borderRadius: 22,
    padding: 18,
    border: "1px solid #e5e7eb",
    marginBottom: 16,
  },

  detailCard: {
    background: "#fff",
    borderRadius: 22,
    padding: 18,
    border: "1px solid #e5e7eb",
    marginBottom: 16,
  },

  sectionTitle: {
    margin: "0 0 14px",
    fontSize: 24,
    fontWeight: 950,
    color: "#111827",
  },

  labelImageWrap: {
    borderRadius: 18,
    background: "#fff",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
  },

  labelImage: {
    width: "100%",
    display: "block",
    objectFit: "contain",
    background: "#fff",
  },

  manualBtn: {
    height: 60,
    borderRadius: 16,
    background: "#111827",
    color: "#fff",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 19,
    fontWeight: 950,
  },

  guideBox: {
    padding: 18,
    borderRadius: 16,
    background: "#ecfdf5",
    border: "1px solid #86efac",
    color: "#166534",
    fontSize: 17,
    fontWeight: 850,
    lineHeight: 1.8,
    wordBreak: "keep-all",
  },

  text: {
    fontSize: 17,
    lineHeight: 1.9,
    color: "#374151",
    whiteSpace: "pre-wrap",
    wordBreak: "keep-all",
  },

  iframe: {
    border: "none",
    borderRadius: 16,
    background: "#000",
  },

  consultCard: {
    background: "#ecfdf5",
    border: "1px solid #86efac",
    borderRadius: 22,
    padding: 20,
  },

  consultTitle: {
    margin: "0 0 10px",
    fontSize: 23,
    fontWeight: 950,
    color: "#166534",
  },

  consultText: {
    margin: 0,
    fontSize: 17,
    lineHeight: 1.8,
    color: "#166534",
    fontWeight: 800,
    wordBreak: "keep-all",
  },

  errorBox: {
    padding: 24,
    borderRadius: 16,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontWeight: 900,
    lineHeight: 1.8,
  },
};