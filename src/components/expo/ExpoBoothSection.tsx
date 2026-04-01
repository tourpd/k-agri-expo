import React from "react";
import Link from "next/link";
import { safeText } from "@/lib/expo/home-utils";

export default function ExpoBoothSection({
  booths,
}: {
  booths: any[];
}) {
  return (
    <section id="booths" style={S.sectionWrap} className="expo-section">
      <div style={S.sectionHead} className="expo-section-head">
        <div>
          <div style={S.sectionEyebrow}>EXHIBITORS</div>
          <h2 style={S.sectionTitle}>🏢 참가기업 부스</h2>
          <div style={S.sectionDesc}>
            온라인 박람회에 참가한 주요 기업과 대표 부스를 한눈에 확인하세요.
          </div>
        </div>

        <Link href="/expo/booths" style={S.moreLink}>
          전체 보기 →
        </Link>
      </div>

      <div style={S.logoRow} className="expo-logo-row">
        {booths.slice(0, 8).map((b: any) => {
          const name = safeText(b?.name, "부스");
          return (
            <Link
              key={String(b.booth_id)}
              href={`/expo/booths/${String(b.booth_id)}`}
              style={S.logoChip}
            >
              {name}
            </Link>
          );
        })}
      </div>

      <div style={S.boothFeatureGrid} className="expo-booth-grid">
        {booths.length === 0 ? (
          <div style={S.emptyBox}>아직 참가 부스가 없습니다.</div>
        ) : (
          booths.slice(0, 3).map((b: any) => {
            const boothId = String(b.booth_id);
            const name = safeText(b?.name, "부스");
            const region = safeText(b?.region, "지역 미입력");
            const cat = safeText(b?.category_primary, "카테고리 미입력");
            const intro = safeText(b?.intro, "소개가 아직 없습니다.");

            return (
              <Link
                key={boothId}
                href={`/expo/booths/${boothId}`}
                style={S.boothFeatureCard}
                className="expo-booth-card"
              >
                <div style={S.boothHead}>
                  <div style={S.boothAvatar}>{name.slice(0, 1)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={S.boothName}>{name}</div>
                    <div style={S.boothMeta}>
                      {region} · {cat}
                    </div>
                  </div>
                </div>

                <div style={S.boothIntro}>{intro}</div>
                <div style={S.boothCta}>부스 보기 →</div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  sectionWrap: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "28px 24px 0",
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-end",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
    letterSpacing: 0.4,
  },
  sectionTitle: {
    margin: "8px 0 0",
    fontSize: "clamp(26px, 5vw, 34px)",
    lineHeight: 1.1,
    fontWeight: 950,
    letterSpacing: -0.8,
  },
  sectionDesc: {
    marginTop: 10,
    fontSize: 15,
    color: "#64748b",
    lineHeight: 1.8,
  },
  moreLink: {
    textDecoration: "none",
    color: "#0f172a",
    fontWeight: 900,
    fontSize: 14,
  },
  logoRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },
  logoChip: {
    textDecoration: "none",
    color: "#334155",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    borderRadius: 999,
    padding: "10px 14px",
    fontWeight: 900,
    fontSize: 13,
  },
  boothFeatureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
  },
  boothFeatureCard: {
    textDecoration: "none",
    color: "#0f172a",
    borderRadius: 28,
    padding: 20,
    background: "#fff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 12px 28px rgba(15,23,42,0.05)",
  },
  boothHead: {
    display: "flex",
    gap: 14,
    alignItems: "center",
  },
  boothAvatar: {
    width: 66,
    height: 66,
    borderRadius: 20,
    background: "linear-gradient(135deg, #0f172a 0%, #16a34a 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 950,
    fontSize: 28,
    flexShrink: 0,
  },
  boothName: {
    fontSize: "clamp(20px, 4.6vw, 24px)",
    fontWeight: 950,
  },
  boothMeta: {
    marginTop: 8,
    fontSize: 13,
    color: "#64748b",
    fontWeight: 800,
    lineHeight: 1.6,
  },
  boothIntro: {
    marginTop: 16,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.8,
    minHeight: 76,
  },
  boothCta: {
    marginTop: 16,
    fontWeight: 950,
    fontSize: 14,
  },
  emptyBox: {
    borderRadius: 24,
    padding: 24,
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    color: "#64748b",
    lineHeight: 1.8,
  },
};