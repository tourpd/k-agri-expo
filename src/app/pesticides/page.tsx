import Link from "next/link";
import type { CSSProperties } from "react";
import { CROPS, getProblem } from "@/lib/problems/catalog";
import { PSIS_CROP_NAME, pesticideQueriesFor } from "@/lib/pesticides/map";
import { PSIS_SOURCE, explainDilution, psisEnabled, searchPesticides, type PesticideItem } from "@/lib/pesticides/psis";
import StickyAsk from "@/components/problems/StickyAsk";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = { title: "등록 농약 찾기 | K-Agri Expo" };

type SP = Promise<{ crop?: string; pest?: string; from?: string; area?: string }>;

/**
 * 등록 농약 — 농진청 자료를 그대로 보여 줍니다(추천 아님).
 * 작물 + 병해충 → 상표·회사·희석배수·수확 전 일수·횟수. 평수 환산은 참고용.
 */
export default async function PesticidesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const from = sp.from ? getProblem(sp.from) : null;
  const queries = from ? pesticideQueriesFor(from) : [];
  const crop = (sp.crop ?? queries[0]?.crop ?? "").trim();
  const pest = (sp.pest ?? queries[0]?.pest ?? "").trim();
  const area = Math.max(1, Math.min(100000, parseInt(sp.area ?? "300", 10) || 300));

  let items: PesticideItem[] | null = null;
  if (crop && pest) items = await searchPesticides({ crop, pest, limit: 60 });

  // 같은 상표는 한 번만 (여러 작물·병해충 행이 오므로)
  const seen = new Set<string>();
  const list = (items ?? []).filter((i) => {
    const k = i.brand + "|" + i.dilution + "|" + i.phi;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return (
    <div style={S.wrap}>
      {from ? <Link href={`/p/${from.slug}`} style={S.back}>‹ {from.title}</Link> : null}
      <h1 style={S.title}>등록 농약 찾기</h1>
      <p style={S.sub}>작물과 병해충을 고르면 농촌진흥청에 등록된 농약이 그대로 나옵니다. 희석배수·수확 전 사용 일수·횟수를 꼭 지키세요. 구매는 가까운 농약판매상에서.</p>

      <form action="/pesticides" method="get" style={S.form}>
        {from ? <input type="hidden" name="from" value={from.slug} /> : null}
        <select name="crop" defaultValue={crop} style={S.select} aria-label="작물">
          <option value="">작물</option>
          {CROPS.filter((c) => PSIS_CROP_NAME[c.key]).map((c) => (
            <option key={c.key} value={PSIS_CROP_NAME[c.key]}>{c.icon} {PSIS_CROP_NAME[c.key]}</option>
          ))}
        </select>
        <input name="pest" defaultValue={pest} placeholder="병해충 (예: 총채벌레, 탄저병)" style={S.input} />
        <input name="area" defaultValue={String(area)} inputMode="numeric" style={S.area} aria-label="평수" />
        <button type="submit" style={S.btn}>찾기</button>
      </form>
      {queries.length > 1 ? (
        <div style={S.chips}>
          {queries.map((q) => (
            <Link key={q.pest} href={`/pesticides?from=${from!.slug}&crop=${encodeURIComponent(q.crop)}&pest=${encodeURIComponent(q.pest)}&area=${area}`} style={{ ...S.chip, ...(q.pest === pest ? S.chipOn : {}) }}>{q.pest}</Link>
          ))}
        </div>
      ) : null}

      {!psisEnabled() ? (
        <div style={S.warn}>농진청 농약 자료 연결을 준비 중입니다(인증키 등록 대기). 그동안은 <a href="https://psis.rda.go.kr" target="_blank" rel="noreferrer" style={S.link}>농약안전정보시스템</a>에서 직접 찾아보실 수 있습니다.</div>
      ) : !crop || !pest ? (
        <div style={S.empty}>작물과 병해충을 넣어 주세요.</div>
      ) : list.length === 0 ? (
        <div style={S.empty}>"{crop} · {pest}"로 등록된 농약을 찾지 못했습니다. 병해충 이름을 조금 다르게 적어 보세요(예: 응애 → 점박이응애).</div>
      ) : (
        <>
          <div style={S.count}>{crop} · {pest} — 등록 농약 {list.length}개 (가나다·등록 순, 추천 아님)</div>
          <div style={S.list}>
            {list.map((i, idx) => {
              const calc = explainDilution(i.dilution, area);
              return (
                <div key={idx} style={S.card}>
                  <div style={S.head}>
                    <div>
                      <div style={S.brand}>{i.brand} <span style={S.item}>{i.item}</span></div>
                      <div style={S.company}>{i.company}{i.moa ? ` · 작용기작 ${i.moa}` : ""}{i.use ? ` · ${i.use}` : ""}</div>
                    </div>
                  </div>
                  <div style={S.grid}>
                    <div style={S.cell}><div style={S.k}>희석배수(10a당)</div><div style={S.v}>{i.dilution || "-"}</div></div>
                    <div style={S.cell}><div style={S.k}>수확 전</div><div style={S.v}>{i.phi ? `${i.phi}일 전까지` : "-"}</div></div>
                    <div style={S.cell}><div style={S.k}>횟수</div><div style={S.v}>{i.maxTimes ? `${i.maxTimes}회 이내` : "-"}</div></div>
                    <div style={S.cell}><div style={S.k}>방법</div><div style={S.v}>{i.method || "-"}</div></div>
                  </div>
                  {calc ? <div style={S.calc}>내 밭 {area.toLocaleString()}평 → {calc}</div> : null}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div style={S.foot}>
        자료: {PSIS_SOURCE.label} ({PSIS_SOURCE.license}). 라벨(농약 포장지)의 사용기준이 우선이며, 평수 환산은 참고용입니다. 농약은 온라인 판매가 금지돼 있어 구매 버튼을 두지 않습니다.
      </div>

      <div style={{ height: 84 }} />
      <StickyAsk problemSlug={from?.slug ?? "calc"} problemTitle={from ? from.title : "농약 문의"} needsCrop={!from} />
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  wrap: { padding: "4px 0 20px", maxWidth: 680, margin: "0 auto" },
  back: { fontSize: 13, fontWeight: 800, color: "#15803d", textDecoration: "none" },
  title: { marginTop: 6, fontSize: 26, fontWeight: 950, color: "#0f172a", letterSpacing: -0.5 },
  sub: { marginTop: 6, fontSize: 14, color: "#475569", lineHeight: 1.6, wordBreak: "keep-all" },
  form: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1.4fr 70px auto", gap: 6 },
  select: { padding: "12px 8px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 15, background: "#fff", minWidth: 0 },
  input: { padding: "12px 10px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 15, minWidth: 0 },
  area: { padding: "12px 8px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 15, textAlign: "right", minWidth: 0 },
  btn: { padding: "12px 14px", borderRadius: 12, border: 0, background: "#15803d", color: "#fff", fontWeight: 900, fontSize: 15 },
  chips: { marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" },
  chip: { fontSize: 13, fontWeight: 800, padding: "7px 11px", borderRadius: 999, background: "#f1f5f9", color: "#0f172a", textDecoration: "none" },
  chipOn: { background: "#0f172a", color: "#fff" },
  warn: { marginTop: 14, padding: 14, borderRadius: 14, background: "#fffbeb", border: "1px solid #fde68a", color: "#78350f", fontSize: 14, lineHeight: 1.6 },
  empty: { marginTop: 14, padding: 14, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", fontSize: 14, lineHeight: 1.6 },
  count: { marginTop: 14, fontSize: 13, fontWeight: 800, color: "#64748b" },
  list: { marginTop: 8, display: "grid", gap: 8 },
  card: { padding: 14, borderRadius: 14, border: "1px solid #e2e8f0", background: "#fff" },
  head: { display: "flex", justifyContent: "space-between", gap: 8 },
  brand: { fontSize: 17, fontWeight: 950, color: "#0f172a", wordBreak: "keep-all" },
  item: { fontSize: 12, fontWeight: 700, color: "#64748b", marginLeft: 6 },
  company: { marginTop: 2, fontSize: 12, color: "#64748b" },
  grid: { marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 },
  cell: { padding: "8px 10px", borderRadius: 10, background: "#f8fafc" },
  k: { fontSize: 11, color: "#94a3b8", fontWeight: 800 },
  v: { marginTop: 2, fontSize: 14, fontWeight: 900, color: "#0f172a", wordBreak: "keep-all" },
  calc: { marginTop: 8, fontSize: 13, color: "#14532d", background: "#f0fdf4", borderRadius: 10, padding: "8px 10px", lineHeight: 1.5 },
  foot: { marginTop: 16, fontSize: 12, color: "#64748b", lineHeight: 1.6 },
  link: { color: "#15803d", fontWeight: 800 },
};
