import Link from "next/link";
import type { CSSProperties } from "react";
import AskBox from "@/components/problems/AskBox";
import { SYMPTOMS } from "@/lib/problems/catalog";

export const dynamic = "force-dynamic";

export const metadata = { title: "직접 묻기 | K-Agri Expo" };

export default function AskPage() {
  return (
    <div style={S.wrap}>
      <AskBox big />
      <div style={S.or}>또는</div>
      <div style={S.two}>
        <a href="/ai-consult" style={S.card}>
          <div style={S.cardIcon}>📷</div>
          <div style={S.cardTitle}>사진으로 진단</div>
          <div style={S.cardSub}>잎·열매 사진을 올리면 바로 원인을 가려 드립니다</div>
        </a>
        <a href="tel:010-8216-1253" style={S.card}>
          <div style={S.cardIcon}>📞</div>
          <div style={S.cardTitle}>전화로 묻기</div>
          <div style={S.cardSub}>010-8216-1253 · 통화 내용은 정리해서 기업에 연결합니다</div>
        </a>
      </div>
      <div style={S.label}>증상으로 고르기</div>
      <div style={S.chips}>
        {SYMPTOMS.map((s) => (
          <Link key={s.key} href={`/symptom/${s.key}`} style={S.chip}>{s.icon} {s.label}</Link>
        ))}
      </div>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  wrap: { padding: "4px 0 40px", maxWidth: 820, margin: "0 auto" },
  or: { margin: "16px 0 10px", textAlign: "center", fontSize: 13, color: "#94a3b8" },
  two: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  card: { padding: 16, borderRadius: 16, border: "1px solid #e5e7eb", background: "#fff", textDecoration: "none", color: "#0f172a" },
  cardIcon: { fontSize: 26 },
  cardTitle: { marginTop: 6, fontSize: 16, fontWeight: 950 },
  cardSub: { marginTop: 4, fontSize: 12, color: "#64748b", lineHeight: 1.5, wordBreak: "keep-all" },
  label: { marginTop: 24, fontSize: 12, fontWeight: 950, color: "#16a34a", letterSpacing: 0.6 },
  chips: { marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" },
  chip: { padding: "9px 12px", borderRadius: 999, background: "#f1f5f9", color: "#0f172a", fontWeight: 800, fontSize: 14, textDecoration: "none" },
};
