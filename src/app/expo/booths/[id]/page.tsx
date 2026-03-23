// src/app/expo/booths/[id]/page.tsx
import React from "react";
import Link from "next/link";
import { getPublicBoothDetail, getPublicDealsByBooth } from "@/lib/expoPublic";
import BoothVisitTracker from "@/components/expo/BoothVisitTracker";
import InquiryForm from "@/components/expo/InquiryForm";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f-]{36}$/i.test(v);
}

function safe(v: any, fallback: string) {
  const s = typeof v === "string" ? v : "";
  return s.trim() ? s : fallback;
}

function fmtDeadline(v?: string | null) {
  if (!v) return null;

  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;

  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(d.getDate()).padStart(2, "0")} 마감`;
}

export default async function ExpoBoothDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const boothId = decodeURIComponent(id ?? "").trim();

  if (!isUuid(boothId)) {
    return (
      <main style={pageWrap}>
        <h1 style={titleStyle}>잘못된 부스 주소입니다.</h1>

        <Link href="/expo/booths" style={btnGhost}>
          부스 목록
        </Link>
      </main>
    );
  }

  const { booth, products } = await getPublicBoothDetail(boothId);

  let deals: any[] = [];

  try {
    deals = await getPublicDealsByBooth(boothId, 10);
  } catch {
    deals = [];
  }

  if (!booth) {
    return (
      <main style={pageWrap}>
        <h1 style={titleStyle}>부스를 찾을 수 없습니다.</h1>

        <Link href="/expo/booths" style={btnGhost}>
          부스 목록
        </Link>
      </main>
    );
  }

  const boothAny = booth as any;

  const phone = boothAny.phone;
  const email = boothAny.email;
  const description = boothAny.description;

  const hallId = boothAny.hall_id ? String(boothAny.hall_id) : null;

  const telHref = phone ? `tel:${String(phone).replace(/\s+/g, "")}` : null;
  const mailHref = email ? `mailto:${email}` : null;

  return (
    <main style={pageWrap}>
      {/* 방문 기록 */}
      <BoothVisitTracker boothId={boothAny.booth_id} />

      <header style={header}>
        <div>
          <div style={boothBadge}>EXPO BOOTH</div>

          <h1 style={titleStyle}>{boothAny.name ?? "부스"}</h1>

          <div style={meta}>
            {boothAny.region ?? "지역"} ·{" "}
            {boothAny.category_primary ?? "카테고리"}
          </div>
        </div>

        <div style={headerActions}>
          {hallId ? (
            <Link href={`/expo/hall/${hallId}`} style={btnGhost}>
              전시장으로
            </Link>
          ) : null}

          <Link href="/expo/booths" style={btnGhost}>
            부스 목록
          </Link>
        </div>
      </header>

      <section style={hero}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={sectionTitle}>한 줄 소개</div>

          <div style={introText}>
            {boothAny.intro ?? "업체 소개가 없습니다."}
          </div>

          <div style={contactWrap}>
            {telHref ? (
              <a href={telHref} style={btnPrimary}>
                전화 상담
              </a>
            ) : (
              <span style={btnDisabled}>전화 없음</span>
            )}

            {mailHref ? (
              <a href={mailHref} style={btnGhost}>
                이메일 문의
              </a>
            ) : (
              <span style={btnDisabled}>이메일 없음</span>
            )}
          </div>
        </div>

        <div style={descWrap}>
          <div style={sectionTitle}>부스 소개</div>

          <div style={descBox}>
            {description ?? "업체 설명이 없습니다."}
          </div>
        </div>
      </section>

      {deals.length > 0 && (
        <section style={{ marginTop: 30 }}>
          <h2 style={productTitle}>🔥 EXPO 특가</h2>

          <div style={productGrid}>
            {deals.map((d: any) => (
              <Link
                key={d.deal_id}
                href={`/expo/deals/${d.deal_id}`}
                style={productCard}
              >
                <div style={{ fontWeight: 900 }}>
                  {safe(d.title, "EXPO 특가")}
                </div>

                <div style={{ marginTop: 6, fontSize: 13, color: "#444" }}>
                  {safe(d.description, "행사 특가 상품")}
                </div>

                <div style={price}>{safe(d.expo_price_text, "특가")}</div>

                <div style={dealMeta}>
                  {safe(d.stock_text, "수량 한정")}
                  {fmtDeadline(d.deadline_at) ? ` · ${fmtDeadline(d.deadline_at)}` : ""}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 상담 요청 */}
      <InquiryForm boothId={boothAny.booth_id} />

      <section style={{ marginTop: 30 }}>
        <h2 style={productTitle}>제품</h2>

        {!products || products.length === 0 ? (
          <div style={emptyBox}>등록된 제품이 없습니다.</div>
        ) : (
          <div style={productGrid}>
            {products.map((p: any) => (
              <Link
                key={p.product_id}
                href={`/expo/product/${p.product_id}`}
                style={productCard}
              >
                <div style={productName}>{safe(p.name, "제품명 없음")}</div>

                <div style={productDesc}>{safe(p.description, "설명 없음")}</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

/* 스타일 */

const pageWrap: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: 30,
  background: "#fff",
  minHeight: "100vh",
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 12,
  marginBottom: 20,
  flexWrap: "wrap",
};

const headerActions: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const boothBadge: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#ef4444",
};

const titleStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 900,
  margin: "4px 0",
  color: "#111",
};

const meta: React.CSSProperties = {
  fontSize: 13,
  color: "#666",
};

const hero: React.CSSProperties = {
  border: "1px solid #eee",
  padding: 20,
  borderRadius: 12,
  display: "flex",
  gap: 20,
  flexWrap: "wrap",
  background: "#fafafa",
};

const sectionTitle: React.CSSProperties = {
  fontWeight: 800,
  marginBottom: 8,
};

const introText: React.CSSProperties = {
  lineHeight: 1.8,
  color: "#111",
};

const descWrap: React.CSSProperties = {
  width: 350,
  maxWidth: "100%",
};

const descBox: React.CSSProperties = {
  border: "1px solid #eee",
  padding: 12,
  borderRadius: 8,
  background: "#fff",
  lineHeight: 1.8,
  color: "#111",
};

const contactWrap: React.CSSProperties = {
  marginTop: 14,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 14px",
  background: "#111",
  color: "#fff",
  borderRadius: 8,
  textDecoration: "none",
  fontWeight: 900,
};

const btnGhost: React.CSSProperties = {
  padding: "10px 14px",
  border: "1px solid #ddd",
  borderRadius: 8,
  textDecoration: "none",
  color: "#111",
  background: "#fff",
  fontWeight: 900,
};

const btnDisabled: React.CSSProperties = {
  padding: "10px 14px",
  background: "#eee",
  borderRadius: 8,
  color: "#999",
};

const productTitle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 900,
  color: "#111",
};

const productGrid: React.CSSProperties = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))",
  gap: 14,
};

const productCard: React.CSSProperties = {
  border: "1px solid #eee",
  padding: 16,
  borderRadius: 12,
  textDecoration: "none",
  color: "#111",
  background: "#fff",
  display: "block",
};

const productName: React.CSSProperties = {
  fontWeight: 900,
};

const productDesc: React.CSSProperties = {
  marginTop: 6,
  fontSize: 13,
  color: "#444",
  lineHeight: 1.7,
};

const price: React.CSSProperties = {
  marginTop: 10,
  fontWeight: 900,
  color: "#dc2626",
};

const dealMeta: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  color: "#666",
};

const emptyBox: React.CSSProperties = {
  marginTop: 12,
  padding: 16,
  borderRadius: 12,
  background: "#f8fafc",
  color: "#64748b",
  border: "1px solid #e5e7eb",
};