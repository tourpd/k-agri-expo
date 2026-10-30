import Link from "next/link";
import type { CSSProperties } from "react";
import { CROPS, SYMPTOMS, seasonalProblems } from "@/lib/problems/catalog";
import { NEED_CATEGORY_LABEL, getNeed } from "@/lib/problems/needs";
import { GRADE_LABEL, cropGrade, getMonthPlan } from "@/lib/problems/season";
import AskBox from "@/components/problems/AskBox";

/**
 * 홈 입구 3개 — 내 작물 / 증상으로 찾기 / 지금 특가
 * 농민은 전시관이 아니라 작물과 증상으로 들어옵니다.
 */
export default function HomeEntrySection({ dealCount }: { dealCount?: number }) {
  const plan = getMonthPlan();
  const hot = seasonalProblems().slice(0, 6);
  // 지금 한창인 작물 먼저, 준비 시기, 월동·휴면 순
  const order = { now: 0, prep: 1, rest: 2 } as const;
  const crops = [...CROPS].sort((a, b) => order[cropGrade(a.key).grade] - order[cropGrade(b.key).grade]);
  const symptoms = [...SYMPTOMS].sort((a, b) => plan.symptoms.indexOf(a.key) - plan.symptoms.indexOf(b.key));
  const needs = plan.needs.slice(0, 6).map(getNeed).filter(Boolean);

  return (
    <section style={S.wrap} className="home-entry">
      <style>{CSS}</style>

      <div style={S.eyebrow}>{plan.month}월 · {plan.headline}</div>
      <h2 style={S.title} className="home-entry-title">지금 무슨 문제가 있으세요?</h2>

      {/* 입구 0: 직접 묻기 */}
      <div style={{ marginTop: 14 }}>
        <AskBox />
      </div>

      {/* 입구 1: 작물 */}
      <div style={S.block}>
        <div style={S.blockHead}>
          <div style={S.blockTitle}>🌱 내 작물</div>
          <div style={S.blockSub}>이달 할 일 · 지금 도는 문제 · 해답 제품</div>
        </div>
        <div className="home-entry-chips" style={S.chips}>
          {crops.map((c) => {
            const g = cropGrade(c.key).grade;
            return (
              <Link key={c.key} href={`/crop/${c.key}`} style={g === "now" ? S.chip : g === "prep" ? S.chipPrep : S.chipRest}>
                <span style={S.chipIcon}>{c.icon}</span>
                <span>{c.label}</span>
                {g !== "now" ? <span style={S.chipGrade}>{GRADE_LABEL[g]}</span> : null}
              </Link>
            );
          })}
        </div>
      </div>

      {/* 입구 2: 증상 */}
      <div style={S.block}>
        <div style={S.blockHead}>
          <div style={S.blockTitle}>🔍 증상으로 찾기</div>
          <a href="/ai-consult" style={S.photoBtn}>📷 사진으로 진단</a>
        </div>
        <div className="home-entry-chips" style={S.chips}>
          {symptoms.map((s) => (
            <Link key={s.key} href={`/symptom/${s.key}`} style={S.chipSoft}>
              <span style={S.chipIcon}>{s.icon}</span>
              <span>{s.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 입구 2.5: 살포량 계산기 */}
      <Link href="/yakbaksa" style={S.calcBanner}>
        <div>
          <div style={S.calcTitle}>👨‍⚕️ 약박사 — 내 밭엔 몇 병?</div>
          <div style={S.calcSub}>약·영양제 고르고 평수만 넣으면 몇 병·물 몇 통·한 통에 몇 ml·언제 뿌릴지 바로</div>
        </div>
        <div style={S.calcGo}>›</div>
      </Link>

      {/* 입구 3: 이달의 준비물 (자재·농기구·묘종·설비) */}
      <div style={S.block}>
        <div style={S.blockHead}>
          <div style={S.blockTitle}>🧰 {plan.month}월의 준비물</div>
          <Link href="/need" style={S.moreLink}>전체 보기 →</Link>
        </div>
        <div className="home-entry-needs" style={S.needGrid}>
          {needs.map((n) => n ? (
            <Link key={n.slug} href={`/need/${n.slug}`} style={S.needCard}>
              <div style={S.needCat}>{NEED_CATEGORY_LABEL[n.category].icon} {NEED_CATEGORY_LABEL[n.category].label}</div>
              <div style={S.needTitle}>{n.title}</div>
            </Link>
          ) : null)}
        </div>
      </div>

      {/* 입구 4: 특가 + 지금 시기 */}
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
  .home-entry-needs { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
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
  chipPrep: { display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px", borderRadius: 999, background: "#fff", border: "1px solid #e2e8f0", color: "#0f172a", fontWeight: 800, fontSize: 15, textDecoration: "none" },
  chipRest: { display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 12px", borderRadius: 999, background: "#f8fafc", border: "1px dashed #e2e8f0", color: "#94a3b8", fontWeight: 700, fontSize: 14, textDecoration: "none" },
  chipGrade: { fontSize: 11, fontWeight: 800, color: "#94a3b8" },
  chipIcon: { fontSize: 16, lineHeight: 1 },
  moreLink: { fontSize: 13, fontWeight: 900, color: "#1d4ed8", textDecoration: "none" },
  calcBanner: { marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 18px", borderRadius: 18, background: "#0f172a", color: "#fff", textDecoration: "none" },
  calcTitle: { fontSize: 17, fontWeight: 950 },
  calcSub: { marginTop: 4, fontSize: 13, color: "#cbd5e1", lineHeight: 1.5, wordBreak: "keep-all" },
  calcGo: { fontSize: 28, fontWeight: 900, color: "#86efac" },
  needGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 },
  needCard: { padding: "12px", borderRadius: 14, background: "#eff6ff", border: "1px solid #bfdbfe", textDecoration: "none", color: "#0f172a" },
  needCat: { fontSize: 11, fontWeight: 900, color: "#1d4ed8" },
  needTitle: { marginTop: 4, fontSize: 14, fontWeight: 900, lineHeight: 1.3, wordBreak: "keep-all" },
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
