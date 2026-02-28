// src/app/expo/product/[id]/page.tsx
import Link from "next/link";
import { getPublicProduct, getPublicBoothDetail } from "@/lib/expoPublic";

export const dynamic = "force-dynamic";

export default async function ExpoProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getPublicProduct(params.id);

  if (!product) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>제품을 찾을 수 없습니다.</h1>
        <Link href="/expo/booths" style={{ textDecoration: "underline" }}>부스 목록으로</Link>
      </main>
    );
  }

  const { booth } = await getPublicBoothDetail(product.booth_id);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, color: "#666", fontWeight: 800 }}>제품</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, margin: "6px 0 0" }}>{product.name ?? "제품명 없음"}</h1>
          <div style={{ marginTop: 8, color: "#666", fontSize: 13 }}>
            부스:{" "}
            <Link href={`/expo/booths/${product.booth_id}`} style={{ textDecoration: "underline", color: "#111", fontWeight: 800 }}>
              {booth?.name ?? product.booth_id}
            </Link>
          </div>
        </div>
        <Link href={`/expo/booths/${product.booth_id}`} style={btnGhost}>
          부스 보기
        </Link>
      </header>

      <section style={{ marginTop: 14, ...card }}>
        <div style={{ fontSize: 14, fontWeight: 900 }}>요약</div>
        <div style={{ marginTop: 8, color: "#222", lineHeight: 1.8 }}>
          {product.summary ?? "요약이 없습니다."}
        </div>

        {product.price_text ? (
          <div style={{ marginTop: 12, color: "#666", fontSize: 13 }}>
            가격/조건: <b style={{ color: "#111" }}>{product.price_text}</b>
          </div>
        ) : null}
      </section>

      <section style={{ marginTop: 14, ...card }}>
        <div style={{ fontSize: 14, fontWeight: 900 }}>설명</div>
        <div style={{ marginTop: 8, color: "#333", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
          {product.description ?? "상세 설명이 없습니다."}
        </div>
      </section>

      <section style={{ marginTop: 14, ...card, background: "#fafafa" }}>
        <div style={{ fontSize: 14, fontWeight: 900 }}>문의</div>
        <div style={{ marginTop: 8, color: "#555", lineHeight: 1.7 }}>
          제품 문의는 부스에서 <b>전화/카톡</b>으로 바로 하시면 됩니다.
        </div>
        <div style={{ marginTop: 12 }}>
          <Link href={`/expo/booths/${product.booth_id}`} style={btnPrimary}>
            부스에서 문의하기 →
          </Link>
        </div>
      </section>
    </main>
  );
}

const card: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 16,
  padding: 14,
  background: "#fff",
};

const btnPrimary: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 900,
  textDecoration: "none",
};

const btnGhost: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
  color: "#111",
  fontWeight: 900,
  textDecoration: "none",
};