import Link from "next/link";
import type { CSSProperties } from "react";
import { CROPS, SYMPTOMS, seasonalProblems } from "@/lib/problems/catalog";

/**
 * 홈 입구 3개 — 내 작물 / 증상으로 찾기 / 지금 특가
 * 농민은 전시관이 아니라 작물과 증상으로 들어옵니다.
 */
export default function HomeEntrySection({ dealCount }: { dealCount?: number }) {
  const hot = seasonalProblems().slice(0, 5);

  return (
    <section style={S.wrap} className="home-entry">
      <style>{CSS}</style>

      <div style={S.eyebrow}>지금 무슨 문제가 있으세요?</div>
      <h2 style={S.title} className="home-entry-title">작물과 증상으로 바로 찾으세요</h2>

      {/* 입구 1: 작물 */}
      <div style={S.block}>
        <div style={S.blockHead}>
          <div style={S.blockTitle}>🌱 내 작물</div>
          <div style={S.blockSub}>이달 할 일 · 지금 도는 문제 · 해답 제품</div>
        </div>
        <div className="home-entry-chips" style={S.chips}>
          {CROPS.map((c) => (
            <Link key={c.key} href={`/crop/${c.key}`} style={S.chip}>
              <span style={S.chipIcon}>{c.icon}</span>
              <span>{c.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 입구 2: 증상 */}
      <div style={S.block}>
        <div style={S.blockHead}>
          <div style={S.blockTitle}>🔍 증상으로 찾기</div>
          <a href="/ai-consult" style={S.photoBtn}>📷 사진으로 진단</a>
        </div>
        <div className="home-entry-chips" style={S.chips}>
          {SYMPTOMS.map((s) => (
            <Link key={s.key} href={`/symptom/${s.key}`} style={S.chipSoft}>
              <span style={S.chipIcon}>{s.icon}</span>
              <span>{s.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 입구 3: 특가 + 지금 시기 */}
      <div className="home-entry-two" style={S.two}>
        <Link href="/expo/deals" style={S.dealCard}>
          <div style={S.dealLabel}>🔥 지금 특가 · 공동구매</div>
          <div style={S.dealTitle}>
            {typeof dealCount === "number" && dealCount > 0 ? `진행 중 ${dealCount}건` : "진행 중인 특가 보기"}
          </div>
          <div style={S.dealSub}>정가 대비 얼마나 싼지 숫자로 보여 드립니다</div>
          <div style={S.dealCta}>특가 보러 가기 →</div>
        </Link>

        <div style={S.hotCard}>
          <div style={S.hotLabel}>📅 지금 시기에 꼭 볼 문제</div>
          <div style={S.hotList}>
            {hot.map((p) => (
              <Link key={p.slug} href={`/p/${p.slug}`} style={S.hotItem}>
                <span style={S.hotDot}>•</span>
                <span style={S.hotText}>{p.title}</span>
                <span style={S.hotArrow}>›</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const CSS = `
.home-entry-chips { display:flex; flex-wrap:wrap; gap:8px; }
@media (max-width: 768px) {
  .home-entry-title { font-size: 24px !important; }
  .home-entry-two { grid-template-columns: 1fr !important; }
  .home-entry-chips a { font-size: 14px !important; padding: 9px 12px !important; }
}
`;

const S: Record<string, CSSProperties> = {
  wrap: { marginTop: 4 },
  eyebrow: { fontSize: 12, fontWeight: 950, color: "#16a34a", letterSpacing: 0.6 },
  title: { marginTop: 8, fontSize: 32, fontWeight: 950, color: "#0f172a", letterSpacing: -0.8, lineHeight: 1.15, wordBreak: "keep-all" },
  block: { marginTop: 16, padding: "14px 14px 12px", borderRadius: 18, background: "#fff", border: "1px solid #e5e7eb" },
  blockHead: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 },
  blockTitle: { fontSize: 17, fontWeight: 950, color: "#0f172a" },
  blockSub: { fontSize: 12, color: "#64748b" },
  photoBtn: { padding: "7px 12px", borderRadius: 999, background: "#0f172a", color: "#fff", fontSize: 13, fontWeight: 900, textDecoration: "none" },
  chips: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: { display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px", borderRadius: 999, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#14532d", fontWeight: 900, fontSize: 15, textDecoration: "none" },
  chipSoft: { display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px", borderRadius: 999, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#0f172a", fontWeight: 800, fontSize: 15, textDecoration: "none" },
  chipIcon: { fontSize: 16, lineHeight: 1 },
  two: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  dealCard: { display: "flex", flexDirection: "column", gap: 6, padding: 18, borderRadius: 18, background: "linear-gradient(135deg,#7c2d12,#ea580c)", color: "#fff", textDecoration: "none" },
  dealLabel: { fontSize: 12, fontWeight: 900, opacity: 0.9 },
  dealTitle: { fontSize: 22, fontWeight: 950, letterSpacing: -0.3 },
  dealSub: { fontSize: 13, opacity: 0.9, lineHeight: 1.5, flex: 1 },
  dealCta: { fontSize: 14, fontWeight: 900 },
  hotCard: { padding: 16, borderRadius: 18, background: "#fff", border: "1px solid #e5e7eb" },
  hotLabel: { fontSize: 13, fontWeight: 950, color: "#0f172a" },
  hotList: { marginTop: 8, display: "grid", gap: 2 },
  hotItem: { display: "flex", alignItems: "center", gap: 8, padding: "7px 4px", textDecoration: "none", color: "#0f172a", borderBottom: "1px solid #f1f5f9" },
  hotDot: { color: "#16a34a", fontWeight: 900 },
  hotText: { flex: 1, fontSize: 14, fontWeight: 800, wordBreak: "keep-all" },
  hotArrow: { color: "#94a3b8" },
};
