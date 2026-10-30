import Link from "next/link";
import type { CSSProperties } from "react";
import { requireAdminUser } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getProblem } from "@/lib/problems/catalog";
import type { SubmissionRow } from "@/lib/submissions/products";
import { decideSubmission } from "./actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 승인함 — 기업이 올린 제품을 보고 [승인] 또는 [반려]. 승인 즉시 농민 화면에 노출.
 */
export default async function SubmissionsAdminPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdminUser();
  const sp = await searchParams;
  const status = ["pending", "approved", "rejected"].includes(sp.status ?? "") ? (sp.status as string) : "pending";

  let rows: SubmissionRow[] = [];
  let tableMissing = false;
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("expo_product_submissions").select("*").eq("status", status).order("created_at", { ascending: false }).limit(200);
    if (error) tableMissing = /does not exist|42P01|schema cache/i.test(error.message);
    rows = (data ?? []) as SubmissionRow[];
  } catch {
    tableMissing = true;
  }

  return (
    <div style={S.wrap}>
      <h1 style={S.title}>기업 제품 등록 승인함</h1>
      <div style={S.tabs}>
        {[["pending", "대기"], ["approved", "승인됨"], ["rejected", "반려"]].map(([k, l]) => (
          <Link key={k} href={`/admin/submissions?status=${k}`} style={{ ...S.tab, ...(status === k ? S.tabOn : {}) }}>{l}</Link>
        ))}
        <a href="/api/admin/organic-companies?format=csv" style={S.csv}>공시 기업 명단 CSV</a>
      </div>

      {tableMissing ? (
        <div style={S.warn}>
          표가 아직 없습니다. Supabase → SQL Editor에서 <code>supabase/migrations/20261030_product_submissions.sql</code> 내용을 실행하면 바로 동작합니다.
        </div>
      ) : rows.length === 0 ? (
        <div style={S.empty}>{status === "pending" ? "대기 중인 등록이 없습니다." : "항목이 없습니다."}</div>
      ) : (
        <div style={S.list}>
          {rows.map((r) => {
            const dose = (r.dose_rules ?? []).map((d) =>
              d.kind === "dilution" ? `${d.method} ${d.ratio.toLocaleString()}${d.ratioMax ? `~${d.ratioMax.toLocaleString()}` : ""}배`
              : d.kind === "perArea" ? `${d.method} ${d.amount}${d.unit}/${d.areaPyeong}평${d.waterL ? `/물 ${d.waterL}L` : ""}`
              : d.text,
            );
            return (
              <div key={r.id} style={S.card}>
                <div style={S.head}>
                  <div>
                    <div style={S.company}>{r.company_name} · {r.company_phone}{r.contact_name ? ` · ${r.contact_name}` : ""}{r.company_email ? ` · ${r.company_email}` : ""}</div>
                    <div style={S.product}>{r.product_name} <span style={S.group}>{r.product_group ?? ""}{r.organic_cert_no ? ` · ${r.organic_cert_no}` : ""}</span></div>
                  </div>
                  <div style={S.date}>{new Date(r.created_at).toLocaleString("ko-KR")}</div>
                </div>
                {r.feature ? <div style={S.line}>{r.feature}</div> : null}
                <div style={S.grid}>
                  <div><b>용도</b> {r.uses?.join(", ") || "-"}</div>
                  <div><b>작물</b> {r.crops?.join(", ") || "-"}</div>
                  <div><b>사용량</b> {dose.join(" / ") || "-"}</div>
                  <div><b>시기</b> {r.timing || "-"}</div>
                  <div><b>포장·가격</b> {r.packages?.join(", ") || "-"} {r.price_krw ? `· ${r.price_krw.toLocaleString()}원` : ""}</div>
                  <div><b>판매</b> {r.sellable ? "온라인 가능" : "온라인 불가"} {r.buy_url ? <a href={r.buy_url} target="_blank" rel="noreferrer" style={S.a}>구매링크</a> : null} {r.homepage_url ? <a href={r.homepage_url} target="_blank" rel="noreferrer" style={S.a}>홈페이지</a> : null}</div>
                  <div style={{ gridColumn: "1 / -1" }}><b>문제 페이지</b> {(r.problem_slugs ?? []).map((s) => getProblem(s)?.title ?? s).join(", ") || "(없음 — 승인해도 문제 페이지엔 안 붙고 계산기 검색에만 나옴)"}</div>
                  {r.cautions?.length ? <div style={{ gridColumn: "1 / -1" }}><b>주의</b> {r.cautions.join(", ")}</div> : null}
                  {r.image_url ? <div style={{ gridColumn: "1 / -1" }}><a href={r.image_url} target="_blank" rel="noreferrer" style={S.a}>사진 보기</a></div> : null}
                </div>
                <form action={decideSubmission} style={S.actions}>
                  <input type="hidden" name="id" value={r.id} />
                  <input name="memo" defaultValue={r.admin_memo ?? ""} placeholder="메모(반려 사유 등)" style={S.memo} />
                  {status !== "approved" ? <button name="decision" value="approved" style={S.ok}>승인</button> : null}
                  {status !== "rejected" ? <button name="decision" value="rejected" style={S.no}>반려</button> : null}
                  {status !== "pending" ? <button name="decision" value="pending" style={S.back}>대기로</button> : null}
                  {status === "approved" ? <Link href={`/calc?p=s:${r.id}`} style={S.view} target="_blank">농민 화면 보기</Link> : null}
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  wrap: { padding: 20, maxWidth: 960, margin: "0 auto", fontFamily: "system-ui, sans-serif" },
  title: { fontSize: 22, fontWeight: 900, color: "#0f172a" },
  tabs: { marginTop: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  tab: { padding: "8px 14px", borderRadius: 999, background: "#f1f5f9", color: "#0f172a", fontWeight: 800, textDecoration: "none", fontSize: 14 },
  tabOn: { background: "#0f172a", color: "#fff" },
  csv: { marginLeft: "auto", fontSize: 13, color: "#1d4ed8", fontWeight: 800 },
  warn: { marginTop: 16, padding: 14, borderRadius: 12, background: "#fffbeb", border: "1px solid #fde68a", color: "#78350f", lineHeight: 1.6 },
  empty: { marginTop: 16, padding: 14, color: "#64748b" },
  list: { marginTop: 14, display: "grid", gap: 12 },
  card: { padding: 16, borderRadius: 14, border: "1px solid #e5e7eb", background: "#fff" },
  head: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  company: { fontSize: 13, color: "#16a34a", fontWeight: 800 },
  product: { marginTop: 2, fontSize: 18, fontWeight: 900, color: "#0f172a" },
  group: { fontSize: 12, color: "#64748b", fontWeight: 700 },
  date: { fontSize: 12, color: "#94a3b8" },
  line: { marginTop: 8, fontSize: 14, color: "#334155" },
  grid: { marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontSize: 13, color: "#334155", lineHeight: 1.5 },
  a: { color: "#1d4ed8", fontWeight: 700, marginLeft: 6 },
  actions: { marginTop: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  memo: { flex: 1, minWidth: 180, padding: "9px 10px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13 },
  ok: { padding: "10px 16px", borderRadius: 10, border: 0, background: "#15803d", color: "#fff", fontWeight: 900, cursor: "pointer" },
  no: { padding: "10px 16px", borderRadius: 10, border: 0, background: "#b91c1c", color: "#fff", fontWeight: 900, cursor: "pointer" },
  back: { padding: "10px 16px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a", fontWeight: 800, cursor: "pointer" },
  view: { fontSize: 13, color: "#1d4ed8", fontWeight: 800 },
};
