// src/app/expo/booths/page.tsx
import Link from "next/link";
import { getPublicBooths } from "@/lib/expoPublic";

export const dynamic = "force-dynamic";

type SP = {
  q?: string | string[];
  region?: string | string[];
  category?: string | string[];
  tab?: string | string[];
};

function pick1(v: string | string[] | undefined) {
  if (!v) return "";
  return Array.isArray(v) ? (v[0] ?? "") : v;
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));
}

function buildUrl(params: { tab?: string; q?: string; region?: string; category?: string }) {
  const sp = new URLSearchParams();
  if (params.tab && params.tab !== "all") sp.set("tab", params.tab);
  if (params.q) sp.set("q", params.q);
  if (params.region) sp.set("region", params.region);
  if (params.category) sp.set("category", params.category);
  const qs = sp.toString();
  return `/expo/booths${qs ? `?${qs}` : ""}`;
}

export default async function ExpoBoothsPage({
  searchParams,
}: {
  // ✅ Next.js 16: searchParams가 Promise로 들어올 수 있음
  searchParams?: Promise<SP>;
}) {
  const sp = (await searchParams) ?? {};

  const q = pick1(sp.q).trim();
  const region = pick1(sp.region).trim();
  const category = pick1(sp.category).trim();
  const tab = (pick1(sp.tab) || "all").trim();

  const booths = await getPublicBooths({ q, category, region, limit: 60 });

  const regions = uniq(booths.map((b) => (b.region ?? "").trim()).filter(Boolean));
  const categories = uniq(booths.map((b) => (b.category_primary ?? "").trim()).filter(Boolean));

  return (
    <main style={pageWrap}>
      {/* 상단 배너 */}
      <section style={banner}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#111", opacity: 0.7 }}>K-Agri Expo</div>

          <h1 style={{ fontSize: 28, fontWeight: 950, margin: "8px 0 0", color: "#111" }}>
            온라인 부스 엑스포
          </h1>

          <p style={{ margin: "10px 0 0", color: "#333", lineHeight: 1.7 }}>
            농민은 <b>부스</b>를 둘러보고 <b>전화·카톡</b>으로 바로 문의합니다.
            <br />
            업체는 <b>부스 소개</b>와 <b>제품</b>을 등록해 “입점 쇼룸”을 만듭니다.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <Link href="/booth/new" style={btnPrimary}>
              + 부스 만들기(업체)
            </Link>
            <Link href="/login?next=/vendor" style={btnGhost}>
              업체 로그인
            </Link>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: "#555" }}>
            ※ v1: “둘러보기 + 즉시 문의”까지. (v1.5: 문의폼/리드관리/찜)
          </div>
        </div>

        <div style={bannerRight}>
          <div style={{ fontWeight: 900, marginBottom: 8, color: "#111" }}>농민이 보는 흐름</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#333", lineHeight: 1.7 }}>
            <li>부스 카드에서 “한 줄 소개”로 3초 판단</li>
            <li>부스 상세에서 제품 리스트 확인</li>
            <li>전화 / 카톡 / 이메일로 즉시 문의</li>
          </ul>

          <div style={{ marginTop: 10, fontSize: 12, color: "#666", lineHeight: 1.6 }}>
            업체는 “한 줄 소개 + 상세 설명 + 대표 제품 3개”만 넣어도
            <br />
            엑스포 느낌이 바로 살아납니다.
          </div>
        </div>
      </section>

      {/* 필터 바 */}
      <section style={{ marginTop: 16, ...filterBar }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={pillLabel}>탭</span>
          <Link href={buildUrl({ tab: "all", q, region, category })} style={tab === "all" ? pillOn : pillOff}>
            공개 부스
          </Link>
          <Link
            href={buildUrl({ tab: "my", q, region, category })}
            style={tab === "my" ? pillOn : pillOff}
            title="(v1은 all 중심. v1.5에서 내 부스 권한 연동)"
          >
            내 부스(예고)
          </Link>
        </div>

        <form style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }} action="/expo/booths">
          <input type="hidden" name="tab" value={tab} />

          <input name="q" defaultValue={q} placeholder="검색: 업체명/소개/지역/카테고리" style={input} />

          <select name="region" defaultValue={region} style={select}>
            <option value="">지역 전체</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select name="category" defaultValue={category} style={select}>
            <option value="">카테고리 전체</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button type="submit" style={btnGhost}>
            필터 적용
          </button>

          <Link href="/expo/booths" style={{ ...btnGhost, textAlign: "center" }}>
            초기화
          </Link>
        </form>
      </section>

      {/* 결과 요약 */}
      <div style={{ marginTop: 12, color: "#666", fontSize: 13 }}>
        총 <b style={{ color: "#111" }}>{booths.length}</b>개 부스
        {q ? (
          <>
            {" "}
            · 검색: <b style={{ color: "#111" }}>{q}</b>
          </>
        ) : null}
        {region ? (
          <>
            {" "}
            · 지역: <b style={{ color: "#111" }}>{region}</b>
          </>
        ) : null}
        {category ? (
          <>
            {" "}
            · 카테고리: <b style={{ color: "#111" }}>{category}</b>
          </>
        ) : null}
      </div>

      {/* 카드 목록 */}
      <section style={{ marginTop: 14 }}>
        {booths.length === 0 ? (
          <div style={emptyBox}>
            <div style={{ fontWeight: 900, fontSize: 16, color: "#111" }}>조건에 맞는 부스가 없습니다.</div>
            <div style={{ marginTop: 6, color: "#666", lineHeight: 1.7 }}>
              검색어를 줄이거나 지역/카테고리를 “전체”로 바꿔보세요.
            </div>
          </div>
        ) : (
          <div style={grid}>
            {booths.map((b) => {
              const title = b.name ?? "부스";
              const regionText = b.region ?? "지역 미입력";
              const catText = b.category_primary ?? "카테고리 미입력";
              const intro = b.intro ?? "한 줄 소개가 아직 없습니다.";

              // ✅ DB 컬럼명 그대로: phone/email/kakao_url
              const telHref = b.phone ? `tel:${b.phone.replace(/\s+/g, "")}` : null;
              const mailHref = b.email ? `mailto:${b.email}` : null;
              const kakaoHref = b.kakao_url ?? null;

              return (
                <div key={b.booth_id} style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: "#666", fontWeight: 800 }}>
                        {regionText} · {catText}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 18, fontWeight: 950, color: "#111" }}>{title}</div>
                    </div>

                    {/* ✅ 상세 라우트: /expo/booths/[id] 에 booth_id 전달 */}
                    <Link href={`/expo/booths/${b.booth_id}`} style={btnMini}>
                      부스 보기
                    </Link>
                  </div>

                  <div style={{ marginTop: 10, color: "#333", lineHeight: 1.6, fontSize: 14 }}>{intro}</div>

                  <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {telHref ? (
                      <a href={telHref} style={btnPrimarySm}>
                        📞 전화
                      </a>
                    ) : (
                      <span style={btnDisabledSm}>📞 없음</span>
                    )}

                    {kakaoHref ? (
                      <a href={kakaoHref} target="_blank" rel="noreferrer" style={btnGhostSm}>
                        💬 카톡
                      </a>
                    ) : (
                      <span style={btnDisabledSm}>💬 없음</span>
                    )}

                    {mailHref ? (
                      <a href={mailHref} style={btnGhostSm}>
                        ✉️ 이메일
                      </a>
                    ) : null}

                    <Link href={`/expo/booths/${b.booth_id}`} style={btnGhostSm}>
                      제품 보기
                    </Link>
                  </div>

                  <div style={{ marginTop: 10, fontSize: 12, color: "#888" }}>
                    booth_id:{" "}
                    <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{b.booth_id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <footer style={{ marginTop: 24, paddingTop: 14, borderTop: "1px solid #eee", color: "#666", fontSize: 12 }}>
        운영 메모: v1은 “보이는 쇼룸 + 즉시 문의”에 집중합니다. (농민: 목록 → 부스 → 제품 → 문의)
      </footer>
    </main>
  );
}

/** Styles */
const pageWrap: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "26px 16px",
  background: "#fff",
  color: "#111",
  minHeight: "100vh",
};

const banner: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 18,
  padding: 18,
  background: "linear-gradient(180deg, #ffffff 0%, #fafafa 100%)",
  display: "flex",
  gap: 14,
  flexWrap: "wrap",
  alignItems: "stretch",
};

const bannerRight: React.CSSProperties = {
  width: 360,
  maxWidth: "100%",
  border: "1px solid #eee",
  borderRadius: 16,
  padding: 14,
  background: "#fff",
};

const filterBar: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 16,
  padding: 12,
  background: "#fff",
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const grid: React.CSSProperties = {
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

const emptyBox: React.CSSProperties = {
  border: "1px dashed #ddd",
  borderRadius: 16,
  padding: 18,
  background: "#fafafa",
};

const input: React.CSSProperties = {
  width: 260,
  maxWidth: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  fontSize: 14,
};

const select: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  fontSize: 14,
  background: "#fff",
};

const pillLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  color: "#666",
  padding: "6px 10px",
};

const pillOn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 900,
  textDecoration: "none",
  fontSize: 13,
};

const pillOff: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #ddd",
  background: "#fff",
  color: "#111",
  fontWeight: 900,
  textDecoration: "none",
  fontSize: 13,
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

const btnMini: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
  color: "#111",
  fontWeight: 950,
  textDecoration: "none",
  whiteSpace: "nowrap",
  alignSelf: "flex-start",
};

const btnPrimarySm: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 950,
  textDecoration: "none",
  fontSize: 13,
};

const btnGhostSm: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
  color: "#111",
  fontWeight: 950,
  textDecoration: "none",
  fontSize: 13,
};

const btnDisabledSm: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #eee",
  background: "#f3f4f6",
  color: "#9ca3af",
  fontWeight: 950,
  fontSize: 13,
};