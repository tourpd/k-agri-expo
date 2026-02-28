// src/app/expo/page.tsx
import Link from "next/link";
import { getPublicBooths } from "@/lib/expoPublic";

export const dynamic = "force-dynamic";

export default async function ExpoHomePage() {
  // 메인에는 최신 공개 부스만 간단히 노출
  const booths = await getPublicBooths({ limit: 12 });

  return (
    <main style={pageWrap}>
      {/* HERO */}
      <section style={hero}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.7 }}>K-Agri Expo</div>
          <h1 style={{ fontSize: 30, fontWeight: 950, margin: "8px 0 0" }}>온라인 부스 엑스포</h1>
          <p style={{ margin: "10px 0 0", color: "#333", lineHeight: 1.7 }}>
            농민은 부스를 둘러보고 <b>전화/카톡</b>으로 바로 문의합니다.
            <br />
            업체는 부스·제품을 등록해 “입점 쇼룸”을 만듭니다.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <Link href="/expo/booths" style={btnPrimary}>
              부스 둘러보기
            </Link>
            <Link href="/booth/new" style={btnGhost}>
              + 부스 만들기(업체)
            </Link>
            <Link href="/login?next=/vendor" style={btnGhost}>
              업체 로그인
            </Link>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
            v1: “목록 → 부스 → 제품 → 즉시 문의” 플로우까지
          </div>
        </div>

        <div style={heroRight}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>농민이 보는 순서</div>
          <ol style={{ margin: 0, paddingLeft: 18, color: "#333", lineHeight: 1.7 }}>
            <li>부스 목록에서 3초 판단(한 줄 소개)</li>
            <li>부스 상세에서 제품 확인</li>
            <li>전화/카톡으로 바로 문의</li>
          </ol>

          <div style={{ marginTop: 10, fontSize: 12, color: "#666", lineHeight: 1.6 }}>
            업체는 <b>한 줄 소개 + 상세 설명 + 대표 제품 3개</b>만 넣어도
            <br />
            “입점된 느낌”이 즉시 납니다.
          </div>
        </div>
      </section>

      {/* 최신 부스 */}
      <section style={{ marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 950, margin: 0 }}>최근 공개 부스</h2>
            <div style={{ marginTop: 6, fontSize: 13, color: "#666" }}>
              지금 공개(active) 상태인 부스만 노출됩니다.
            </div>
          </div>

          <Link href="/expo/booths" style={btnGhost}>
            전체 부스 보기 →
          </Link>
        </div>

        {booths.length === 0 ? (
          <div style={{ marginTop: 12, color: "#666" }}>아직 공개된 부스가 없습니다.</div>
        ) : (
          <div style={grid}>
            {booths.map((b) => (
              <Link
                key={b.booth_id}
                href={`/expo/booths/${b.booth_id}`}
                style={{ ...card, textDecoration: "none", color: "#111" }}
              >
                <div style={{ fontSize: 12, color: "#666", fontWeight: 800 }}>
                  {(b.region ?? "지역 미입력")} · {(b.category_primary ?? "카테고리 미입력")}
                </div>
                <div style={{ marginTop: 6, fontSize: 18, fontWeight: 950 }}>
                  {b.name ?? "부스"}
                </div>
                <div style={{ marginTop: 10, fontSize: 14, color: "#333", lineHeight: 1.6 }}>
                  {b.intro ?? "한 줄 소개가 아직 없습니다."}
                </div>

                <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {b.phone ? <span style={pillOn}>📞 전화</span> : <span style={pillOff}>📞 없음</span>}
                  {b.kakao_url ? <span style={pillOn}>💬 카톡</span> : <span style={pillOff}>💬 없음</span>}
                  {b.email ? <span style={pillOn}>✉️ 이메일</span> : null}
                </div>

                <div style={{ marginTop: 10, fontSize: 12, color: "#888" }}>
                  booth_id:{" "}
                  <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                    {b.booth_id}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer style={{ marginTop: 26, paddingTop: 14, borderTop: "1px solid #eee", color: "#666", fontSize: 12 }}>
        운영 메모: v1은 “보이는 쇼룸 + 즉시 문의”에 집중합니다.
      </footer>
    </main>
  );
}

/* ---------------- styles ---------------- */

const pageWrap: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "26px 16px",
  background: "#fff",
  color: "#111",
  minHeight: "100vh",
};

const hero: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 18,
  padding: 18,
  background: "linear-gradient(180deg, #ffffff 0%, #fafafa 100%)",
  display: "flex",
  gap: 14,
  flexWrap: "wrap",
  alignItems: "stretch",
};

const heroRight: React.CSSProperties = {
  width: 360,
  maxWidth: "100%",
  border: "1px solid #eee",
  borderRadius: 16,
  padding: 14,
  background: "#fff",
};

const grid: React.CSSProperties = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  gap: 12,
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

const pillOn: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 999,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 900,
  fontSize: 12,
};

const pillOff: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 999,
  border: "1px solid #eee",
  background: "#f3f4f6",
  color: "#9ca3af",
  fontWeight: 900,
  fontSize: 12,
};