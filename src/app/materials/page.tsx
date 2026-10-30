import Link from "next/link";
import type { CSSProperties } from "react";
import { getProblem } from "@/lib/problems/catalog";
import { KIND_LABEL, MATERIAL_KINDS, ORGANIC_SOURCE, allMaterials, kindsForSymptoms, searchMaterials } from "@/lib/materials/organic";
import StickyAsk from "@/components/problems/StickyAsk";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = { title: "친환경 자재 찾기 | K-Agri Expo" };

type SP = Promise<{ q?: string; kind?: string; from?: string }>;

/**
 * 공시된 친환경 자재 2,598개 — 이름·회사로 찾고 회사에 바로 전화
 * 사용량은 아직 없는 제품이 대부분: 그 회사가 등록하면 계산기로 넘어갑니다.
 */
export default async function MaterialsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const from = sp.from ? getProblem(sp.from) : null;
  const kindsFromProblem = from ? kindsForSymptoms(from.symptoms) : [];
  const kind = sp.kind && (MATERIAL_KINDS as readonly string[]).includes(sp.kind) ? sp.kind : "";

  const list = q || kind ? searchMaterials(q, kind || undefined, 60) : kindsFromProblem.length ? searchMaterials("", kindsFromProblem[0], 60) : [];
  const total = allMaterials().length;

  return (
    <div style={S.wrap}>
      {from ? <Link href={`/p/${from.slug}`} style={S.back}>‹ {from.title}</Link> : null}
      <h1 style={S.title}>친환경 자재 찾기</h1>
      <p style={S.sub}>국가에 공시된 유기농업자재 {total.toLocaleString()}개. 이름이나 회사로 찾고, 회사에 바로 전화하세요.</p>

      <form action="/materials" method="get" style={S.searchRow}>
        {from ? <input type="hidden" name="from" value={from.slug} /> : null}
        {kind ? <input type="hidden" name="kind" value={kind} /> : null}
        <input name="q" defaultValue={q} placeholder="제품 이름 또는 회사 (예: 총채, 대유)" style={S.search} />
        <button type="submit" style={S.searchBtn}>찾기</button>
      </form>

      <div style={S.chips}>
        {MATERIAL_KINDS.map((k) => (
          <Link key={k} href={`/materials?kind=${encodeURIComponent(k)}${q ? `&q=${encodeURIComponent(q)}` : ""}${from ? `&from=${from.slug}` : ""}`} style={{ ...S.chip, ...(kind === k || (!kind && kindsFromProblem[0] === k) ? S.chipOn : {}) }}>
            {KIND_LABEL[k]?.icon} {KIND_LABEL[k]?.short ?? k}
          </Link>
        ))}
      </div>

      {list.length === 0 ? (
        <div style={S.empty}>{q || kind ? "맞는 자재가 없습니다. 다른 말로 찾아보세요." : "위에서 이름을 넣거나 종류를 고르세요."}</div>
      ) : (
        <div style={S.list}>
          {list.map((m) => (
            <div key={m.no + m.name} style={S.item}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={S.itemKind}>{KIND_LABEL[m.kind]?.icon} {m.kind} · {m.no}</div>
                <div style={S.itemName}>{m.name}</div>
                <div style={S.itemCompany}>{m.company}</div>
              </div>
              {m.phone ? (
                <a href={`tel:${m.phone}`} style={S.call}>📞 전화</a>
              ) : (
                <span style={S.noPhone}>번호 없음</span>
              )}
            </div>
          ))}
          {list.length >= 60 ? <div style={S.more}>60개까지만 보여 드립니다. 이름을 더 적어 좁혀 보세요.</div> : null}
        </div>
      )}

      <div style={S.foot}>
        자료: {ORGANIC_SOURCE.label} ({ORGANIC_SOURCE.asOf} 기준). 사용량·희석배수는 각 회사에 문의하거나, 회사가 <Link href="/vendor/apply" style={S.link}>제품 등록</Link>하면 계산기에 올라갑니다.
      </div>

      <div style={{ height: 84 }} />
      <StickyAsk problemSlug={from?.slug ?? "calc"} problemTitle={from ? from.title : "친환경 자재 문의"} needsCrop={!from || from.crop === "common"} />
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  wrap: { padding: "4px 0 20px", maxWidth: 680, margin: "0 auto" },
  back: { fontSize: 13, fontWeight: 800, color: "#15803d", textDecoration: "none" },
  title: { marginTop: 6, fontSize: 26, fontWeight: 950, color: "#0f172a", letterSpacing: -0.5 },
  sub: { marginTop: 6, fontSize: 14, color: "#475569", lineHeight: 1.6, wordBreak: "keep-all" },
  searchRow: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr auto", gap: 8 },
  search: { padding: "14px 12px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 16 },
  searchBtn: { padding: "14px 16px", borderRadius: 12, border: 0, background: "#15803d", color: "#fff", fontWeight: 900, fontSize: 15 },
  chips: { marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" },
  chip: { fontSize: 13, fontWeight: 800, padding: "7px 11px", borderRadius: 999, background: "#f1f5f9", color: "#0f172a", textDecoration: "none" },
  chipOn: { background: "#0f172a", color: "#fff" },
  list: { marginTop: 12, display: "grid", gap: 8 },
  item: { display: "flex", gap: 10, alignItems: "center", padding: "12px 14px", borderRadius: 14, border: "1px solid #e2e8f0", background: "#fff" },
  itemKind: { fontSize: 11, fontWeight: 800, color: "#64748b" },
  itemName: { marginTop: 2, fontSize: 16, fontWeight: 950, color: "#0f172a", wordBreak: "keep-all" },
  itemCompany: { marginTop: 2, fontSize: 13, color: "#334155" },
  call: { padding: "10px 12px", borderRadius: 12, background: "#0f172a", color: "#fff", fontWeight: 900, fontSize: 14, textDecoration: "none", whiteSpace: "nowrap" },
  noPhone: { fontSize: 12, color: "#94a3b8" },
  more: { fontSize: 12, color: "#64748b", textAlign: "center", padding: 8 },
  empty: { marginTop: 12, padding: 14, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", fontSize: 14 },
  foot: { marginTop: 16, fontSize: 12, color: "#64748b", lineHeight: 1.6 },
  link: { color: "#15803d", fontWeight: 800 },
};
