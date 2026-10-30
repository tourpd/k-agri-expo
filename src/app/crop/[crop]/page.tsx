import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { CROPS, getCrop, problemsByCrop, type CropKey } from "@/lib/problems/catalog";
import { needsByCrop } from "@/lib/problems/needs";
import { GRADE_LABEL, cropGrade } from "@/lib/problems/season";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ crop: string }> }) {
  const { crop } = await params;
  const c = getCrop(crop);
  return { title: c ? `${c.label} 문제 해결 | K-Agri Expo` : "작물 | K-Agri Expo" };
}

export default async function CropPage({ params }: { params: Promise<{ crop: string }> }) {
  const { crop } = await params;
  const c = getCrop(crop);
  if (!c || c.key === "common") notFound();

  const problems = problemsByCrop(c.key as CropKey);
  const own = problems.filter((p) => p.crop === c.key);
  const common = problems.filter((p) => p.crop === "common");
  const month = new Date().getMonth() + 1;
  const grade = cropGrade(c.key as CropKey);
  const needs = needsByCrop(c.key as CropKey).slice(0, 6);

  return (
    <div style={S.wrap}>
      <div style={S.crumbs}>
        <Link href="/expo" style={S.crumb}>홈</Link>
        <span style={S.crumbSep}>›</span>
        <span style={S.crumbNow}>{c.icon} {c.label}</span>
      </div>

      <h1 style={S.title}>{c.icon} {c.label}</h1>

      <section style={S.month}>
        <div style={S.monthLabel}>{month}월 · {GRADE_LABEL[grade.grade]}</div>
        <div style={S.monthText}>{grade.note || c.monthNote}</div>
      </section>

      <div style={S.label}>지금 도는 문제</div>
      {own.length === 0 ? (
        <div style={S.empty}>이 작물의 문제 페이지를 준비하고 있습니다. 아래 공통 문제나 사진 진단을 이용해 주세요.</div>
      ) : (
        <div style={S.grid}>
          {own.map((p) => (
            <Link key={p.slug} href={`/p/${p.slug}`} style={S.card}>
              <div style={S.cardTop}>
                <div style={S.cardTitle}>{p.title.replace(`${c.label} `, "")}</div>
                {p.seasonal ? <span style={S.hot}>지금</span> : null}
              </div>
              <div style={S.cardSummary}>{p.summary}</div>
              <div style={S.cardCta}>해답 보기 →</div>
            </Link>
          ))}
        </div>
      )}

      <div style={{ ...S.label, marginTop: 24 }}>작물 공통</div>
      <div style={S.grid}>
        {common.map((p) => (
          <Link key={p.slug} href={`/p/${p.slug}`} style={S.card}>
            <div style={S.cardTitle}>{p.title.replace(" (작물 공통)", "")}</div>
            <div style={S.cardSummary}>{p.summary}</div>
            <div style={S.cardCta}>원인 가리기 →</div>
          </Link>
        ))}
        <a href="/ai-consult" style={{ ...S.card, background: "#0f172a", color: "#fff", borderColor: "#0f172a" }}>
          <div style={{ ...S.cardTitle, color: "#fff" }}>📷 사진으로 진단</div>
          <div style={{ ...S.cardSummary, color: "#cbd5e1" }}>증상 사진을 올리면 바로 원인을 가려 드립니다</div>
          <div style={{ ...S.cardCta, color: "#86efac" }}>포토닥터 →</div>
        </a>
      </div>

      {needs.length > 0 ? (
        <>
          <div style={{ ...S.label, marginTop: 24, color: "#1d4ed8" }}>이달의 준비물</div>
          <div style={S.chips}>
            {needs.map((n) => (
              <Link key={n.slug} href={`/need/${n.slug}`} style={{ ...S.chip, background: "#eff6ff", color: "#1e3a8a" }}>{n.title}</Link>
            ))}
          </div>
        </>
      ) : null}

      <div style={S.others}>
        <div style={S.label}>다른 작물</div>
        <div style={S.chips}>
          {CROPS.filter((x) => x.key !== c.key).map((x) => (
            <Link key={x.key} href={`/crop/${x.key}`} style={S.chip}>{x.icon} {x.label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  wrap: { padding: "4px 0 40px", maxWidth: 900, margin: "0 auto" },
  crumbs: { display: "flex", gap: 6, alignItems: "center", fontSize: 13, color: "#64748b" },
  crumb: { color: "#64748b", textDecoration: "none" },
  crumbSep: { color: "#cbd5e1" },
  crumbNow: { color: "#0f172a", fontWeight: 700 },
  title: { marginTop: 10, fontSize: 30, fontWeight: 950, color: "#0f172a", letterSpacing: -0.5 },
  month: { marginTop: 14, padding: "14px 16px", borderRadius: 16, background: "#f0fdf4", border: "1px solid #bbf7d0" },
  monthLabel: { fontSize: 12, fontWeight: 950, color: "#15803d", letterSpacing: 0.5 },
  monthText: { marginTop: 4, fontSize: 15, lineHeight: 1.6, color: "#14532d", wordBreak: "keep-all" },
  label: { marginTop: 22, fontSize: 12, fontWeight: 950, color: "#16a34a", letterSpacing: 0.6 },
  empty: { marginTop: 10, padding: 14, borderRadius: 14, background: "#fffbeb", color: "#92400e", fontSize: 14, lineHeight: 1.6 },
  grid: { marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 },
  card: { display: "flex", flexDirection: "column", gap: 6, padding: 16, borderRadius: 16, border: "1px solid #e5e7eb", background: "#fff", textDecoration: "none", color: "#0f172a" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  cardTitle: { fontSize: 17, fontWeight: 950, wordBreak: "keep-all", lineHeight: 1.3 },
  hot: { fontSize: 11, fontWeight: 900, padding: "3px 8px", borderRadius: 999, background: "#fef3c7", color: "#92400e", whiteSpace: "nowrap" },
  cardSummary: { fontSize: 13, lineHeight: 1.55, color: "#64748b", wordBreak: "keep-all", flex: 1 },
  cardCta: { fontSize: 13, fontWeight: 900, color: "#15803d" },
  others: { marginTop: 20 },
  chips: { marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" },
  chip: { padding: "8px 12px", borderRadius: 999, background: "#f1f5f9", color: "#0f172a", fontWeight: 800, fontSize: 14, textDecoration: "none" },
};
