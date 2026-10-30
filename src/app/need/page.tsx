import Link from "next/link";
import type { CSSProperties } from "react";
import { getCrop } from "@/lib/problems/catalog";
import { getNeed, NEED_CATEGORY_LABEL, NEEDS, type NeedCategory } from "@/lib/problems/needs";
import { getMonthPlan } from "@/lib/problems/season";

export const dynamic = "force-dynamic";

export default function NeedIndexPage() {
  const plan = getMonthPlan();
  const ordered = [
    ...plan.needs.map(getNeed).filter(Boolean),
    ...NEEDS.filter((n) => !plan.needs.includes(n.slug)),
  ] as typeof NEEDS;
  const cats: NeedCategory[] = ["facility", "seedling", "material", "tool"];

  return (
    <div style={S.wrap}>
      <h1 style={S.title}>{plan.month}월의 준비물</h1>
      <p style={S.sub}>{plan.headline}</p>

      {cats.map((cat) => {
        const items = ordered.filter((n) => n.category === cat);
        if (!items.length) return null;
        const meta = NEED_CATEGORY_LABEL[cat];
        return (
          <section key={cat} style={{ marginTop: 22 }}>
            <div style={S.label}>{meta.icon} {meta.label}</div>
            <div style={S.grid}>
              {items.map((n) => (
                <Link key={n.slug} href={`/need/${n.slug}`} style={S.card}>
                  <div style={S.cardTitle}>{n.title}</div>
                  <div style={S.cardWhy}>{n.why}</div>
                  <div style={S.cardCrops}>
                    {n.crops.slice(0, 4).map((k) => getCrop(k)?.icon).join(" ")}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <div style={S.vendor}>
        농기계·설비·육묘 기업이시면 <Link href="/vendor/apply" style={S.link}>입점 신청</Link>으로 제품을 올려 주세요. 승인되면 해당 준비물 페이지에 바로 나옵니다.
      </div>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  wrap: { padding: "4px 0 40px", maxWidth: 900, margin: "0 auto" },
  title: { fontSize: 28, fontWeight: 950, color: "#0f172a" },
  sub: { marginTop: 6, fontSize: 15, lineHeight: 1.6, color: "#334155", wordBreak: "keep-all" },
  label: { fontSize: 13, fontWeight: 950, color: "#1d4ed8", letterSpacing: 0.4 },
  grid: { marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 },
  card: { display: "flex", flexDirection: "column", gap: 6, padding: 16, borderRadius: 16, border: "1px solid #e5e7eb", background: "#fff", textDecoration: "none", color: "#0f172a" },
  cardTitle: { fontSize: 16, fontWeight: 950, wordBreak: "keep-all", lineHeight: 1.3 },
  cardWhy: { fontSize: 13, lineHeight: 1.55, color: "#64748b", wordBreak: "keep-all", flex: 1 },
  cardCrops: { fontSize: 16 },
  vendor: { marginTop: 28, padding: 14, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: 14, color: "#334155", lineHeight: 1.6 },
  link: { color: "#1d4ed8", fontWeight: 800 },
};
