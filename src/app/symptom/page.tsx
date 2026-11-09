import Link from "next/link";
import type { CSSProperties } from "react";
import { SYMPTOMS, problemsBySymptom } from "@/lib/problems/catalog";

export const dynamic = "force-dynamic";

export default function SymptomIndexPage() {
  return (
    <div style={S.wrap}>
      <h1 style={S.title}>증상으로 찾기</h1>
      <p style={S.sub}>지금 눈에 보이는 것을 고르세요. 사진이 있으면 바로 진단이 더 빠릅니다.</p>
      <a href="/ai-consult" style={S.photo}>📷 사진으로 진단하기</a>
      <div style={S.grid}>
        {SYMPTOMS.map((s) => (
          <Link key={s.key} href={`/symptom/${s.key}`} style={S.card}>
            <div style={S.icon}>{s.icon}</div>
            <div style={S.cardTitle}>{s.label}</div>
            <div style={S.count}>{problemsBySymptom(s.key).length}개 문제</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  wrap: { padding: "4px 0 40px", maxWidth: 900, margin: "0 auto" },
  title: { fontSize: 28, fontWeight: 950, color: "#0f172a" },
  sub: { marginTop: 6, fontSize: 14, color: "#64748b" },
  photo: { display: "inline-block", marginTop: 10, padding: "12px 16px", borderRadius: 12, background: "#0f172a", color: "#fff", fontWeight: 900, textDecoration: "none", fontSize: 14 },
  grid: { marginTop: 18, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 },
  card: { padding: 16, borderRadius: 16, border: "1px solid #e5e7eb", background: "#fff", textDecoration: "none", color: "#0f172a" },
  icon: { fontSize: 28 },
  cardTitle: { marginTop: 8, fontSize: 16, fontWeight: 950, wordBreak: "keep-all" },
  count: { marginTop: 4, fontSize: 12, color: "#64748b" },
};
