import Link from "next/link";
import type { CSSProperties } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RuleRow = {
  id: string;
  crop: string | null;
  month: string | null;
  growth_stage: string | null;
  symptom: string | null;
  cause: string | null;
  countermeasure: string | null;
  action_instruction: string | null;
  confidence_score: number | null;
  source_reference: string | null;
  status: string | null;
  created_at: string | null;
};

async function getRules() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("knowledge_rules")
    .select("id,crop,month,growth_stage,symptom,cause,countermeasure,action_instruction,confidence_score,source_reference,status,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return { rules: [] as RuleRow[], error: error.message };
  }

  return { rules: (data || []) as RuleRow[], error: "" };
}

export default async function KnowledgeRulesPage() {
  const { rules, error } = await getRules();

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <header style={S.header}>
          <div>
            <Link href="/admin/knowledge-assets" style={S.back}>← 농업 AI 두뇌센터</Link>
            <div style={S.eyebrow}>K-AGRI KNOWLEDGE RULES</div>
            <h1 style={S.title}>판단규칙 DB</h1>
            <p style={S.sub}>
              자료에서 추출한 작물·월·증상·원인·대책·행동지시를 관리합니다.
            </p>
          </div>
          <Link href="/admin/kagri-writers-room/knowledge" style={S.greenBtn}>자료 업로드</Link>
        </header>

        {error ? (
          <section style={S.errorBox}>
            <b>DB 확인 필요</b>
            <p>{error}</p>
            <p>Supabase SQL Editor에서 migration SQL을 먼저 실행하세요.</p>
          </section>
        ) : null}

        <section style={S.panel}>
          <div style={S.panelHead}>
            <h2>판단규칙 {rules.length}건</h2>
            <p>앞으로 이 숫자가 K-AGRI 두뇌의 성장 지표입니다.</p>
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>작물</th>
                  <th style={S.th}>월</th>
                  <th style={S.th}>생육단계</th>
                  <th style={S.th}>증상</th>
                  <th style={S.th}>원인</th>
                  <th style={S.th}>대책</th>
                  <th style={S.th}>행동지시</th>
                  <th style={S.th}>신뢰도</th>
                  <th style={S.th}>상태</th>
                </tr>
              </thead>
              <tbody>
                {rules.length === 0 ? (
                  <tr>
                    <td style={S.empty} colSpan={9}>
                      아직 저장된 판단규칙이 없습니다. 첫 목표는 안이영 고추 PPT에서 5월~10월 작업지시 30건을 추출하는 것입니다.
                    </td>
                  </tr>
                ) : (
                  rules.map((r) => (
                    <tr key={r.id}>
                      <td style={S.tdStrong}>{r.crop || "-"}</td>
                      <td style={S.td}>{r.month || "-"}</td>
                      <td style={S.td}>{r.growth_stage || "-"}</td>
                      <td style={S.td}>{r.symptom || "-"}</td>
                      <td style={S.td}>{r.cause || "-"}</td>
                      <td style={S.tdStrong}>{r.countermeasure || "-"}</td>
                      <td style={S.tdAction}>{r.action_instruction || "-"}</td>
                      <td style={S.td}>{r.confidence_score ?? "-"}</td>
                      <td style={S.td}><span style={S.badge}>{r.status || "draft"}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

const S: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", background: "#eef4f2", color: "#0f172a", padding: 28 },
  wrap: { maxWidth: 1500, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 24, flexWrap: "wrap" },
  back: { color: "#15803d", textDecoration: "none", fontWeight: 950 },
  eyebrow: { marginTop: 16, color: "#15803d", fontWeight: 950, letterSpacing: ".08em" },
  title: { margin: "8px 0 0", fontSize: 54, lineHeight: 1, fontWeight: 950, letterSpacing: "-.06em" },
  sub: { margin: "14px 0 0", color: "#475569", fontSize: 20, lineHeight: 1.55, fontWeight: 850 },
  greenBtn: { background: "#15803d", color: "#fff", padding: "14px 18px", borderRadius: 14, textDecoration: "none", fontWeight: 950, height: "fit-content" },
  errorBox: { background: "#fff7ed", border: "1px solid #fdba74", borderRadius: 22, padding: 20, marginBottom: 18 },
  panel: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 26, overflow: "hidden" },
  panelHead: { padding: 24, borderBottom: "1px solid #e5e7eb" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 1400 },
  th: { background: "#f1f5f9", color: "#0f172a", padding: 15, textAlign: "left", borderBottom: "1px solid #e5e7eb", fontWeight: 950 },
  td: { padding: 15, borderBottom: "1px solid #e5e7eb", color: "#0f172a", fontWeight: 800, verticalAlign: "top", lineHeight: 1.5 },
  tdStrong: { padding: 15, borderBottom: "1px solid #e5e7eb", color: "#15803d", fontWeight: 950, verticalAlign: "top", lineHeight: 1.5 },
  tdAction: { padding: 15, borderBottom: "1px solid #e5e7eb", color: "#dc2626", fontWeight: 950, verticalAlign: "top", lineHeight: 1.5 },
  badge: { background: "#ecfdf5", color: "#15803d", borderRadius: 999, padding: "7px 11px", fontWeight: 950 },
  empty: { padding: 30, textAlign: "center", color: "#64748b", fontWeight: 900 },
};
