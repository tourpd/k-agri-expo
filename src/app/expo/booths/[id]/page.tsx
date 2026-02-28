// src/app/expo/booths/[id]/page.tsx
import Link from "next/link";
import { getPublicBoothDetail } from "@/lib/expoPublic";

export const dynamic = "force-dynamic";

export default async function ExpoBoothDetailPage({ params }: { params: { id: string } }) {
  // ✅ params.id = booth_id
  const boothId = params.id;
  const { booth, products } = await getPublicBoothDetail(boothId);

  if (!booth) {
    return (
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>부스를 찾을 수 없습니다.</h1>
        <Link href="/expo/booths" style={{ textDecoration: "underline" }}>
          부스 목록으로
        </Link>
      </main>
    );
  }

  const title = booth.name ?? "부스";
  const region = booth.region ?? "지역 미입력";
  const cat = booth.category_primary ?? "카테고리 미입력";

  // ✅ DB 컬럼명 그대로: phone/email/kakao_url
  const telHref = booth.phone ? `tel:${booth.phone.replace(/\s+/g, "")}` : null;
  const mailHref = booth.email ? `mailto:${booth.email}` : null;
  const kakaoHref = booth.kakao_url ?? null;

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px", background: "#fff", color: "#111" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, color: "#666", fontWeight: 800 }}>부스</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, margin: "6px 0 0" }}>{title}</h1>
          <div style={{ marginTop: 8, color: "#666", fontSize: 13 }}>
            {region} · {cat}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/expo/booths" style={btnGhost}>
            부스 목록
          </Link>
        </div>
      </header>

      {/* 상단 쇼룸(3초 설득) */}
      <section style={{ marginTop: 14, ...hero }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 6 }}>한 줄 소개</div>
          <div style={{ fontSize: 15, lineHeight: 1.7, color: "#222" }}>
            {booth.intro ?? "아직 한 줄 소개가 없습니다. (업체가 입력하면 ‘엑스포 느낌’이 여기서 살아납니다.)"}
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {telHref ? <a href={telHref} style={btnPrimary}>📞 전화 문의</a> : <span style={btnDisabled}>📞 전화 없음</span>}
            {kakaoHref ? (
              <a href={kakaoHref} target="_blank" rel="noreferrer" style={btnGhost}>
                💬 카톡 문의
              </a>
            ) : (
              <span style={btnDisabled}>💬 카톡 없음</span>
            )}
            {mailHref ? (
              <a href={mailHref} style={btnGhost}>
                ✉️ 이메일
              </a>
            ) : null}
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
            ※ v1은 “바로 연락”까지. (v1.5에서 문의폼/리드관리 붙입니다)
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: "#888" }}>
            booth_id:{" "}
            <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{booth.booth_id}</span>
          </div>
        </div>

        <div style={{ width: 360, maxWidth: "100%" }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 6 }}>부스 소개</div>
          <div style={{ border: "1px solid #eee", borderRadius: 14, padding: 12, background: "#fff", color: "#333", lineHeight: 1.7, minHeight: 120 }}>
            {booth.description ?? "상세 설명이 아직 없습니다. (주력 제품/사용법/연락 방법을 적으면 완성됩니다.)"}
          </div>
        </div>
      </section>

      {/* 제품 */}
      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>제품</h2>
        {products.length === 0 ? (
          <div style={{ color: "#666" }}>등록된 제품이 없습니다.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {products.map((p) => (
              <Link key={p.id} href={`/expo/product/${p.id}`} style={{ ...card, textDecoration: "none", color: "#111" }}>
                <div style={{ fontSize: 16, fontWeight: 900 }}>{p.name ?? "제품명 없음"}</div>
                <div style={{ marginTop: 6, fontSize: 13, color: "#333", lineHeight: 1.6 }}>
                  {p.summary ?? "요약이 없습니다."}
                </div>
                {p.price_text ? (
                  <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
                    가격: <b style={{ color: "#111" }}>{p.price_text}</b>
                  </div>
                ) : null}
                <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>👉 제품 상세</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

const hero: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 18,
  padding: 16,
  background: "#fafafa",
  display: "flex",
  gap: 14,
  flexWrap: "wrap",
};

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
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
  color: "#111",
  fontWeight: 900,
  textDecoration: "none",
};

const btnDisabled: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #eee",
  background: "#f3f4f6",
  color: "#9ca3af",
  fontWeight: 900,
};