// src/app/expo/deals/[id]/page.tsx
import Link from "next/link";
import { getPublicDeal } from "@/lib/expoPublic";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function safe(v: any, fallback: string) {
  const s = typeof v === "string" ? v : "";
  return s.trim() ? s : fallback;
}

function fmtDeadline(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yy}.${mm}.${dd} ${hh}:${mi}`;
}

export default async function ExpoDealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dealId = decodeURIComponent(id ?? "").trim();

  if (!isUuid(dealId)) {
    return (
      <main style={S.pageWrap}>
        <h1 style={S.title}>잘못된 딜 주소입니다.</h1>
        <p style={S.muted}>deal_id(UUID) 형식이 아닙니다: {dealId}</p>
        <Link href="/expo/deals" style={S.btnGhost}>
          🔥 특가 목록
        </Link>
      </main>
    );
  }

  const { deal, booth } = await getPublicDeal(dealId);

  if (!deal) {
    return (
      <main style={S.pageWrap}>
        <h1 style={S.title}>특가를 찾을 수 없습니다.</h1>
        <Link href="/expo/deals" style={S.btnGhost}>
          🔥 특가 목록
        </Link>
      </main>
    );
  }

  const title = safe((deal as any).title, "EXPO 특가");
  const description = (deal as any).description ? String((deal as any).description) : null;

  const regular = safe((deal as any).regular_price_text, "정가 문의");
  const expo = safe((deal as any).expo_price_text, "EXPO 특가 문의");
  const stock = safe((deal as any).stock_text, "수량 한정");

  const buyUrl = (deal as any).buy_url ? String((deal as any).buy_url) : null;
  const deadlineAt = fmtDeadline((deal as any).deadline_at ?? null);

  const boothId = (deal as any).booth_id ? String((deal as any).booth_id) : null;
  const boothName = booth?.name ? String(booth.name) : "부스";
  const boothHallId = (booth as any)?.hall_id ? String((booth as any).hall_id) : null;

  return (
    <main style={S.pageWrap}>
      <header style={S.header}>
        <div>
          <div style={S.kicker}>🔥 EXPO DEAL</div>
          <h1 style={S.title}>{title}</h1>

          <div style={S.meta}>
            {boothId ? (
              <>
                <span style={S.metaItem}>부스: {boothName}</span>
                <span style={S.dot}>·</span>
              </>
            ) : null}
            {deadlineAt ? (
              <span style={S.metaItem}>마감: {deadlineAt}</span>
            ) : (
              <span style={S.metaItem}>마감: 미설정</span>
            )}
          </div>
        </div>

        <div style={S.headerActions}>
          <Link href="/expo/deals" style={S.btnGhost}>
            ← 특가 목록
          </Link>

          {boothId ? (
            <Link href={`/expo/booths/${boothId}`} style={S.btnGhost}>
              부스 보기 →
            </Link>
          ) : null}

          {boothHallId ? (
            <Link href={`/expo/hall/${boothHallId}`} style={S.btnGhost}>
              전시장 →
            </Link>
          ) : null}
        </div>
      </header>

      <section style={S.card}>
        <div style={S.row}>
          <div style={S.col}>
            <div style={S.label}>설명</div>
            <div style={S.text}>
              {description ? description : "행사 특가 상품입니다. 상세 설명은 곧 업데이트됩니다."}
            </div>
          </div>

          <div style={S.colRight}>
            <div style={S.priceBox}>
              <div style={S.label}>가격</div>
              <div style={S.priceOld}>{regular}</div>
              <div style={S.priceNew}>{expo}</div>
              <div style={S.stock}>{stock}</div>

              {buyUrl ? (
                <a href={buyUrl} target="_blank" rel="noopener noreferrer" style={S.btnPrimary}>
                  구매하기 →
                </a>
              ) : boothId ? (
                <Link href={`/expo/booths/${boothId}`} style={S.btnPrimary}>
                  부스에서 문의/구매 →
                </Link>
              ) : (
                <Link href="/expo/deals" style={S.btnPrimary}>
                  특가 목록 보기 →
                </Link>
              )}

              <div style={S.hint}>
                * 현재는 “외부 구매 링크(buy_url)” 또는 “부스 문의” 방식으로 연결됩니다.
              </div>
            </div>
          </div>
        </div>
      </section>

      {boothId ? (
        <section style={{ marginTop: 18 }}>
          <div style={S.sectionTitle}>이 딜의 부스</div>
          <Link href={`/expo/booths/${boothId}`} style={S.boothCard}>
            <div style={{ fontWeight: 950, fontSize: 15 }}>{boothName}</div>
            <div style={{ marginTop: 6, fontSize: 13, color: "#666" }}>
              {safe((booth as any)?.region, "지역 미입력")} ·{" "}
              {safe((booth as any)?.category_primary, "카테고리 미입력")}
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: "#444", lineHeight: 1.6 }}>
              {safe((booth as any)?.intro, "소개가 아직 없습니다.")}
            </div>
            <div style={{ marginTop: 10, fontWeight: 950 }}>부스 상세 →</div>
          </Link>
        </section>
      ) : null}
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  pageWrap: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: 28,
    background: "#fff",
    minHeight: "100vh",
    color: "#111",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  kicker: { fontSize: 12, fontWeight: 950, color: "#dc2626" },
  title: { fontSize: 28, fontWeight: 950, margin: "6px 0 0", letterSpacing: -0.2 },
  meta: {
    marginTop: 10,
    fontSize: 13,
    color: "#666",
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  metaItem: { fontWeight: 800 },
  dot: { opacity: 0.6 },

  headerActions: { display: "flex", gap: 10, flexWrap: "wrap" },

  btnGhost: {
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: 12,
    textDecoration: "none",
    fontWeight: 900,
    color: "#111",
    background: "#fff",
    display: "inline-block",
  },

  btnPrimary: {
    marginTop: 12,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 950,
    display: "inline-block",
    textAlign: "center",
  },

  muted: { color: "#666" },

  card: {
    border: "1px solid #eee",
    borderRadius: 18,
    padding: 16,
    background: "#fafafa",
  },
  row: { display: "flex", gap: 16, flexWrap: "wrap" },
  col: { flex: 1, minWidth: 280 },
  colRight: { width: 360, maxWidth: "100%" },

  label: { fontSize: 12, fontWeight: 950, color: "#666" },
  text: {
    marginTop: 8,
    lineHeight: 1.8,
    color: "#111",
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 14,
    padding: 12,
  },

  priceBox: { background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: 12 },
  priceOld: { marginTop: 10, fontSize: 12, color: "#777", textDecoration: "line-through" },
  priceNew: { marginTop: 6, fontSize: 16, fontWeight: 950, color: "#dc2626" },
  stock: { marginTop: 8, fontSize: 12, color: "#666" },
  hint: { marginTop: 10, fontSize: 12, color: "#777", lineHeight: 1.6 },

  sectionTitle: { marginTop: 0, fontSize: 16, fontWeight: 950 },

  boothCard: {
    marginTop: 10,
    display: "block",
    border: "1px solid #eee",
    borderRadius: 16,
    padding: 14,
    background: "#fff",
    textDecoration: "none",
    color: "#111",
  },
};