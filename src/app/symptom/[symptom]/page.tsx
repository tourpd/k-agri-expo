import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { getCrop, getSymptom, problemsBySymptom, SYMPTOMS, type SymptomKey } from "@/lib/problems/catalog";

export const dynamic = "force-dynamic";

export default async function SymptomPage({ params }: { params: Promise<{ symptom: string }> }) {
  const { symptom } = await params;
  const s = getSymptom(symptom);
  if (!s) notFound();
  const problems = problemsBySymptom(s.key as SymptomKey);

  return (
    <div style={S.wrap}>
      <div style={S.crumbs}>
        <Link href="/expo" style={S.crumb}>홈</Link>
        <span style={S.crumbSep}>›</span>
        <Link href="/symptom" style={S.crumb}>증상으로 찾기</Link>
        <span style={S.crumbSep}>›</span>
        <span style={S.crumbNow}>{s.label}</span>
      </div>
      <h1 style={S.title}>{s.icon} {s.label}</h1>
      <p style={S.sub}>작물을 고르세요. 사진이 있으면 바로 진단하는 게 빠릅니다.</p>
      <a href="/ai-consult" style={S.photo}>📷 사진으로 진단하기</a>

      <div style={S.grid}>
        {problems.map((p) => {
          const c = getCrop(p.crop);
          return (
            <Link key={p.slug} href={`/p/${p.slug}`} style={S.card}>
              <div style={S.cropTag}>{c?.key === "common" ? "작물 공통" : `${c?.icon ?? ""} ${c?.label ?? ""}`}</div>
              <div style={S.cardTitle}>{p.title}</div>
              <div style={S.cardSummary}>{p.summary}</div>
            </Link>
          );
        })}
      </div>

      <div style={S.label}>다른 증상</div>
      <div style={S.chips}>
        {SYMPTOMS.filter((x) => x.key !== s.key).map((x) => (
          <Link key={x.key} href={`/symptom/${x.key}`} style={S.chip}>{x.icon} {x.label}</Link>
        ))}
      </div>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  wrap: { padding: "4px 0 40px", maxWidth: 900, margin: "0 auto" },
  crumbs: { display: "flex", gap: 6, alignItems: "center", fontSize: 13, color: "#64748b", flexWrap: "wrap" },
  crumb: { color: "#64748b", textDecoration: "none" },
  crumbSep: { color: "#cbd5e1" },
  crumbNow: { color: "#0f172a", fontWeight: 700 },
  title: { marginTop: 10, fontSize: 28, fontWeight: 950, color: "#0f172a" },
  sub: { marginTop: 6, fontSize: 14, color: "#64748b" },
  photo: { display: "inline-block", marginTop: 10, padding: "12px 16px", borderRadius: 12, background: "#0f172a", color: "#fff", fontWeight: 900, textDecoration: "none", fontSize: 14 },
  grid: { marginTop: 18, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 },
  card: { display: "flex", flexDirection: "column", gap: 6, padding: 16, borderRadius: 16, border: "1px solid #e5e7eb", background: "#fff", textDecoration: "none", color: "#0f172a" },
  cropTag: { fontSize: 12, fontWeight: 800, color: "#16a34a" },
  cardTitle: { fontSize: 17, fontWeight: 950, wordBreak: "keep-all", lineHeight: 1.3 },
  cardSummary: { fontSize: 13, lineHeight: 1.55, color: "#64748b", wordBreak: "keep-all" },
  label: { marginTop: 24, fontSize: 12, fontWeight: 950, color: "#16a34a", letterSpacing: 0.6 },
  chips: { marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" },
  chip: { padding: "8px 12px", borderRadius: 999, background: "#f1f5f9", color: "#0f172a", fontWeight: 800, fontSize: 14, textDecoration: "none" },
};
