// src/app/expo/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPublicDeals, getPublicBooths } from "@/lib/expoPublic";

export const dynamic = "force-dynamic";

function fmtDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}.${dd}`;
}

function safeText(v: any, fallback: string) {
  const s = typeof v === "string" ? v : "";
  return s.trim() ? s : fallback;
}

export default async function ExpoIndexPage() {
  // ✅ entry 쿠키 없으면 entry로
  const store = await cookies();
  const has = !!store.get("kagri_expo_entry")?.value;
  if (!has) redirect("/expo/entry");

  // ✅ 메인 데이터(공개용)
  let booths: any[] = [];
  try {
    booths = await getPublicBooths({ limit: 60 });
  } catch {
    booths = [];
  }

  let deals: any[] = [];
  try {
    deals = await getPublicDeals(24);
  } catch {
    deals = [];
  }

  const featured = booths.filter((b) => Boolean((b as any)?.is_featured)).slice(0, 8);
  const latest = booths.slice(0, 12);

  const halls = [
    { id: "agri-inputs", label: "농자재관" },
    { id: "machines", label: "농기계관" },
    { id: "seeds", label: "종자관" },
    { id: "smartfarm", label: "스마트팜" },
  ];

  return (
    <main style={S.page}>
      {/* 헤더 */}
      <header style={S.header}>
        <div>
          <div style={S.kicker}>K-Agri Expo</div>
          <h1 style={S.title}>온라인 박람회</h1>
          <div style={S.sub}>전시장(홀) · 부스 · 특가 · 상담/구매까지 한 번에 연결됩니다.</div>
        </div>

        <div style={S.headerRight}>
          <Link href="/expo/hall/agri-inputs" style={S.btnPrimary}>
            전시장 입장 →
          </Link>
          <Link href="/expo/deals" style={S.btnGhost}>
            🔥 EXPO 특가
          </Link>
          <Link href="/expo/booths" style={S.btnGhost}>
            부스 목록
          </Link>
        </div>
      </header>

      {/* 홀(관) 바로가기 */}
      <section style={S.hallStrip}>
        {halls.map((h) => (
          <Link key={h.id} href={`/expo/hall/${h.id}`} style={S.hallBtn}>
            {h.label}
          </Link>
        ))}
      </section>

      {/* 히어로 */}
      <section style={S.heroGrid}>
        <div style={S.heroCard}>
          <div style={S.heroBadge}>🔥 24시간 한정 딜</div>
          <div style={S.heroHeadline}>EXPO 특가가 들어가면 참여율이 폭발합니다</div>
          <div style={S.heroDesc}>
            딜을 올리면 메인 노출 → 회사들이 “홍보/판매”하려고 스스로 들어오는 구조입니다.
          </div>
          <div style={S.heroActions}>
            <Link href="/expo/deals" style={S.btnPrimary}>
              특가 전체보기
            </Link>
            <Link href="/expo/admin" style={S.btnGhost}>
              (관리자) 딜 등록
            </Link>
          </div>
        </div>

        <div style={S.heroCard2}>
          <div style={S.heroBadge2}>🏢 부스 쇼룸</div>
          <div style={S.heroHeadline}>부스 클릭 → 제품/특가/상담으로 연결</div>
          <div style={S.heroDesc}>부스 상세에서 제품/특가/상담이 한 화면에 보이도록 설계합니다.</div>
          <div style={S.heroActions}>
            <Link href="/expo/hall/agri-inputs" style={S.btnPrimary}>
              전시장 입장
            </Link>
            <Link href="/expo/booths" style={S.btnGhost}>
              부스 탐색
            </Link>
          </div>
        </div>
      </section>

      {/* 특가 */}
      <section style={{ marginTop: 24 }}>
        <div style={S.sectionHead}>
          <h2 style={S.sectionTitle}>🔥 지금 EXPO 특가</h2>
          <Link href="/expo/deals" style={S.moreLink}>
            더 보기 →
          </Link>
        </div>

        {deals.length === 0 ? (
          <div style={S.empty}>
            아직 등록된 EXPO 특가가 없습니다. <br />
            딜 1개만 올려도 메인 분위기가 확 살아납니다.
          </div>
        ) : (
          <div style={S.gridCards}>
            {deals.slice(0, 12).map((d: any) => {
              const dealId = String(d?.deal_id ?? "");
              const title = safeText(d?.title, "EXPO 특가");
              const desc = safeText(d?.description, "행사 특가 상품");
              const regular = safeText(d?.regular_price_text, "정가 문의");
              const expo = safeText(d?.expo_price_text, "EXPO 특가 문의");
              const stock = safeText(d?.stock_text, "수량 한정");
              const deadlineAt = d?.deadline_at ? String(d.deadline_at) : null;

              return (
                <Link key={dealId} href={`/expo/deals/${dealId}`} style={S.dealCard}>
                  <div style={S.dealTop}>
                    <div style={S.dealBadge}>EXPO DEAL</div>
                    {deadlineAt ? <div style={S.dealEnds}>~ {fmtDate(deadlineAt)}</div> : null}
                  </div>

                  <div style={S.dealTitle}>{title}</div>
                  <div style={S.dealDesc}>{desc}</div>

                  <div style={S.dealPriceLine}>
                    <div style={S.priceOld}>{regular}</div>
                    <div style={S.priceNew}>{expo}</div>
                  </div>

                  <div style={S.dealStock}>{stock}</div>
                  <div style={S.dealCTA}>상세 보기 →</div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 추천 부스 */}
      <section style={{ marginTop: 28 }}>
        <div style={S.sectionHead}>
          <h2 style={S.sectionTitle}>🏆 추천 부스</h2>
          <Link href="/expo/booths" style={S.moreLink}>
            더 보기 →
          </Link>
        </div>

        {(featured.length ? featured : latest.slice(0, 8)).length === 0 ? (
          <div style={S.empty}>아직 부스가 없습니다. booths 테이블에 부스 1개만 있어도 메인이 완성됩니다.</div>
        ) : (
          <div style={S.gridBooths}>
            {(featured.length ? featured : latest.slice(0, 8)).map((b: any) => {
              const boothId = String(b.booth_id);
              const name = safeText(b?.name, "부스");
              const region = safeText(b?.region, "지역 미입력");
              const cat = safeText(b?.category_primary, "카테고리 미입력");
              const intro = safeText(b?.intro, "소개가 아직 없습니다.");

              return (
                <Link key={boothId} href={`/expo/booths/${boothId}`} style={S.boothCard}>
                  <div style={S.boothHead}>
                    <div style={S.boothName}>{name}</div>
                    {b?.is_verified ? <div style={S.verified}>검증</div> : null}
                  </div>
                  <div style={S.boothMeta}>
                    {region} · {cat}
                  </div>
                  <div style={S.boothIntro}>{intro}</div>
                  <div style={S.boothCTA}>부스 보기 →</div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 최신 부스 */}
      <section style={{ marginTop: 28, paddingBottom: 60 }}>
        <div style={S.sectionHead}>
          <h2 style={S.sectionTitle}>🆕 새로 들어온 부스</h2>
          <Link href="/expo/booths" style={S.moreLink}>
            전체 보기 →
          </Link>
        </div>

        {latest.length === 0 ? (
          <div style={S.empty}>아직 부스가 없습니다.</div>
        ) : (
          <div style={S.gridBoothsSmall}>
            {latest.slice(0, 12).map((b: any) => {
              const boothId = String(b.booth_id);
              const name = safeText(b?.name, "부스");
              const cat = safeText(b?.category_primary, "카테고리 미입력");
              return (
                <Link key={boothId} href={`/expo/booths/${boothId}`} style={S.boothMini}>
                  <div style={{ fontWeight: 950 }}>{name}</div>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{cat}</div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

/* ================== styles ================== */
const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#fff", color: "#111", padding: "22px 16px" },

  header: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  kicker: { fontSize: 12, fontWeight: 900, color: "#666" },
  title: { margin: "6px 0 0", fontSize: 30, fontWeight: 950, letterSpacing: -0.2 },
  sub: { marginTop: 8, color: "#666", fontSize: 13, lineHeight: 1.7, maxWidth: 620 },

  headerRight: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },

  btnPrimary: {
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    fontWeight: 950,
    textDecoration: "none",
    display: "inline-block",
  },
  btnGhost: {
    border: "1px solid #eee",
    background: "#f9fafb",
    color: "#111",
    borderRadius: 12,
    padding: "10px 12px",
    fontWeight: 950,
    textDecoration: "none",
    display: "inline-block",
  },

  hallStrip: { maxWidth: 1200, margin: "14px auto 0", display: "flex", gap: 10, flexWrap: "wrap" },
  hallBtn: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#111",
    borderRadius: 999,
    padding: "10px 14px",
    fontWeight: 900,
    textDecoration: "none",
    display: "inline-block",
  },

  heroGrid: { maxWidth: 1200, margin: "14px auto 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  heroCard: { border: "1px solid #eee", borderRadius: 18, padding: 16, background: "#fff7ed" },
  heroCard2: { border: "1px solid #eee", borderRadius: 18, padding: 16, background: "#eff6ff" },
  heroBadge: { fontSize: 12, fontWeight: 950, color: "#c2410c" },
  heroBadge2: { fontSize: 12, fontWeight: 950, color: "#1d4ed8" },
  heroHeadline: { marginTop: 10, fontSize: 20, fontWeight: 950, letterSpacing: -0.2 },
  heroDesc: { marginTop: 8, fontSize: 13, color: "#444", lineHeight: 1.7 },
  heroActions: { marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" },

  sectionHead: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 10,
  },
  sectionTitle: { fontSize: 20, fontWeight: 950, margin: 0 },
  moreLink: { fontSize: 13, color: "#111", fontWeight: 900, textDecoration: "none" },

  empty: {
    maxWidth: 1200,
    margin: "10px auto 0",
    border: "1px dashed #e5e7eb",
    borderRadius: 16,
    padding: 16,
    color: "#666",
    lineHeight: 1.7,
    background: "#fafafa",
  },

  gridCards: { maxWidth: 1200, margin: "10px auto 0", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 },
  dealCard: {
    border: "1px solid #eee",
    borderRadius: 16,
    padding: 14,
    textDecoration: "none",
    color: "#111",
    background: "#fff",
    display: "block",
  },
  dealTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  dealBadge: { fontSize: 11, fontWeight: 950, padding: "4px 8px", borderRadius: 999, background: "#111", color: "#fff" },
  dealEnds: { fontSize: 11, color: "#666", fontWeight: 900 },
  dealTitle: { marginTop: 10, fontWeight: 950, fontSize: 15, lineHeight: 1.2 },
  dealDesc: { marginTop: 8, fontSize: 13, color: "#444", lineHeight: 1.6 },
  dealPriceLine: { marginTop: 10 },
  priceOld: { fontSize: 12, color: "#777", textDecoration: "line-through" },
  priceNew: { marginTop: 6, fontWeight: 950, color: "#dc2626" },
  dealStock: { marginTop: 8, fontSize: 12, color: "#666" },
  dealCTA: { marginTop: 10, fontWeight: 950, fontSize: 13 },

  gridBooths: { maxWidth: 1200, margin: "10px auto 0", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
  boothCard: {
    border: "1px solid #eee",
    borderRadius: 16,
    padding: 14,
    textDecoration: "none",
    color: "#111",
    background: "#fff",
    display: "block",
  },
  boothHead: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  boothName: { fontWeight: 950, fontSize: 15 },
  verified: {
    fontSize: 11,
    fontWeight: 950,
    padding: "4px 8px",
    borderRadius: 999,
    background: "#ecfeff",
    color: "#155e75",
    border: "1px solid #cffafe",
  },
  boothMeta: { marginTop: 6, fontSize: 12, color: "#666", fontWeight: 800 },
  boothIntro: { marginTop: 10, fontSize: 13, color: "#444", lineHeight: 1.6 },
  boothCTA: { marginTop: 10, fontWeight: 950, fontSize: 13 },

  gridBoothsSmall: { maxWidth: 1200, margin: "10px auto 0", display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 },
  boothMini: { border: "1px solid #eee", borderRadius: 14, padding: 12, textDecoration: "none", color: "#111", background: "#fff", display: "block" },
};