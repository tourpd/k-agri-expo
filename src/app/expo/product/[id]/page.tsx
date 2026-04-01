// src/app/expo/product/[id]/page.tsx
import React from "react";
import Link from "next/link";
import { getPublicProduct } from "@/lib/expoPublic";
import ProductViewTracker from "@/components/expo/ProductViewTracker";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export default async function ExpoProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = decodeURIComponent(id ?? "").trim();

  if (!isUuid(productId)) {
    return (
      <main style={pageWrap}>
        <h1 style={{ fontSize: 26, fontWeight: 950, margin: 0, color: "#111" }}>
          잘못된 제품 주소입니다.
        </h1>
        <p style={{ marginTop: 10, color: "#666", lineHeight: 1.8 }}>
          product_id(UUID) 형식이 아닙니다: <b>{productId}</b>
        </p>
        <Link href="/expo/booths" style={{ ...btnGhost, display: "inline-block", marginTop: 12 }}>
          부스 목록으로
        </Link>
      </main>
    );
  }

  const product = await getPublicProduct(productId);

  if (!product) {
    return (
      <main style={pageWrap}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>
          제품을 찾을 수 없습니다.
        </h1>
        <Link href="/expo/booths" style={{ ...btnGhost, display: "inline-block", marginTop: 12 }}>
          부스 목록으로
        </Link>
      </main>
    );
  }

  return (
    <main style={pageWrap}>
      <ProductViewTracker productId={product.product_id} />

      <header style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, color: "#666", fontWeight: 800 }}>제품</div>
          <h1 style={{ fontSize: 26, fontWeight: 950, margin: "6px 0 0", color: "#111" }}>
            {product.name ?? "제품"}
          </h1>
          {product.price_text ? (
            <div style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
              가격: <b style={{ color: "#111" }}>{product.price_text}</b>
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <Link href={`/expo/booths/${product.booth_id}`} style={btnPrimary}>
            부스 보러가기
          </Link>
          <Link href="/expo/booths" style={btnGhost}>
            부스 목록
          </Link>
        </div>
      </header>

      <section style={{ marginTop: 14, ...box }}>
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 8, color: "#111" }}>
          제품 설명
        </div>
        <div style={{ color: "#333", lineHeight: 1.8 }}>
          {product.description ? product.description : "설명이 아직 없습니다."}
        </div>
      </section>

      <footer
        style={{
          marginTop: 22,
          paddingTop: 14,
          borderTop: "1px solid #eee",
          color: "#666",
          fontSize: 12,
        }}
      >
        product_id:{" "}
        <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
          {product.product_id}
        </span>
      </footer>
    </main>
  );
}

const pageWrap: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "28px 16px",
  background: "#fff",
  color: "#111",
  minHeight: "100vh",
};

const box: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 16,
  padding: 14,
  background: "#fafafa",
};

const btnPrimary: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 950,
  textDecoration: "none",
};

const btnGhost: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
  color: "#111",
  fontWeight: 950,
  textDecoration: "none",
};