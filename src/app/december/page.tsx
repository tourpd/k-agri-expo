import Link from "next/link";
import type { CSSProperties } from "react";
import { getPartnerProduct, partnerCompany } from "@/lib/problems/partner-catalog";

export const metadata = { title: "12월 엑스포 — 월동·난방 (샘플) | K-Agri Expo" };

/**
 * 이달의 엑스포 샘플 — /december
 * 원본 홈은 그대로 두고, "한 달 한 주제 · 부스 3~5개" 구조를 보여 주는 견본 화면.
 * 부스 1은 카탈로그에 실제로 있는 제품으로 채운 예시(기업 승낙 전), 부스 2·3은 빈 자리.
 */
export default function DecemberExpoSample() {
  const sample = getPartnerProduct("dof-naengout");
  const company = sample ? partnerCompany(sample) : null;

  return (
    <div style={S.wrap}>
      <div style={S.sampleBar}>샘플 화면입니다 · 실제 사이트 홈은 바뀌지 않았습니다</div>

      {/* 간판 */}
      <section style={S.hero}>
        <div style={S.heroTag}>12월 엑스포 · 12월 1일~31일</div>
        <h1 style={S.heroTitle}>월동·난방</h1>
        <p style={S.heroSub}>이달에 밭과 하우스에서 챙길 것을 계산하고, 필요한 자재를 한 곳에서 봅니다</p>
      </section>

      {/* 입구 3개 */}
      <h2 style={S.h2}>내 밭 숫자만 넣으세요</h2>
      <div style={S.doors}>
        <Link href="/bujikpo" style={{ ...S.door, background: "#0a8f8a" }}>
          <b style={S.doorTitle}>부직포 계산기</b>
          <span style={S.doorSub}>몇 롤, 핀 몇 개</span>
        </Link>
        <Link href="/yakbaksa" style={{ ...S.door, background: "#15803d" }}>
          <b style={S.doorTitle}>약박사</b>
          <span style={S.doorSub}>몇 병, 물 몇 통</span>
        </Link>
        <a href="https://plant-doctor-app.vercel.app/" style={{ ...S.door, background: "#0f172a" }}>
          <b style={S.doorTitle}>포토닥터</b>
          <span style={S.doorSub}>사진 찍으면 진단</span>
        </a>
      </div>

      {/* 이달의 부스 */}
      <h2 style={S.h2}>이달의 부스</h2>
      <div style={S.booths}>
        {sample && company ? (
          <div style={S.booth}>
            <div style={S.boothNo}>부스 1 · 예시 (기업 승낙 전)</div>
            <div style={S.boothBrand}>{company.name} · {sample.group}</div>
            <div style={S.boothName}>{sample.name}</div>
            <p style={S.boothText}>{sample.feature}</p>
            <div style={S.boothRow}>
              <span style={S.slot}>제품 영상 자리</span>
              <span style={S.slot}>이달의 조건 자리</span>
            </div>
            <Link href={`/yakbaksa?p=${sample.id}`} style={S.boothBtn}>내 밭엔 몇 병? 계산하기 ›</Link>
          </div>
        ) : null}
        {[2, 3].map((n) => (
          <div key={n} style={{ ...S.booth, ...S.boothEmpty }}>
            <div style={S.boothNo}>부스 {n}</div>
            <div style={S.boothName}>입점 기업을 기다립니다</div>
            <p style={S.boothText}>제품 영상 1편 · 계산기 · 사는 버튼 · 이달의 조건으로 한 장을 채웁니다</p>
            <Link href="/register" style={{ ...S.boothBtn, background: "#fff", color: "#0f172a", border: "2px solid #0f172a" }}>기업 참가 신청 ›</Link>
          </div>
        ))}
      </div>

      {/* 라이브 */}
      <h2 style={S.h2}>이달의 라이브</h2>
      <div style={S.live}>
        <div style={S.liveTitle}>부스 기업이 직접 나와 설명합니다</div>
        <p style={S.liveText}>날짜는 기업과 정한 뒤 올립니다 (샘플). 라이브 시간에만 주는 조건과 경품 추첨이 이 자리에 들어갑니다.</p>
        <Link href="/expo/live" style={S.liveBtn}>라이브 보러 가기 ›</Link>
      </div>

      {/* 더 보기 */}
      <div style={S.more}>
        <Link href="/need" style={S.moreLink}>12월의 준비물 ›</Link>
        <Link href="/ask" style={S.moreLink}>직접 묻기 ›</Link>
      </div>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  wrap: { maxWidth: 680, margin: "0 auto", padding: "4px 0 32px", display: "flex", flexDirection: "column", gap: 14, wordBreak: "keep-all" },
  sampleBar: { padding: "8px 12px", borderRadius: 10, background: "#fef3c7", color: "#78350f", fontSize: 13, fontWeight: 800, textAlign: "center" },
  hero: { padding: "22px 18px", borderRadius: 20, background: "#0f172a", color: "#fff" },
  heroTag: { display: "inline-block", padding: "5px 10px", borderRadius: 999, background: "#ffd21f", color: "#0f172a", fontSize: 13, fontWeight: 900 },
  heroTitle: { margin: "10px 0 6px", fontSize: 40, fontWeight: 950, letterSpacing: -1, lineHeight: 1.1 },
  heroSub: { margin: 0, fontSize: 16, lineHeight: 1.55, color: "#e2e8f0" },
  h2: { margin: "8px 0 0", fontSize: 20, fontWeight: 950, color: "#0f172a" },
  doors: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 },
  door: { display: "flex", flexDirection: "column", gap: 4, padding: "16px 10px", borderRadius: 16, color: "#fff", textDecoration: "none", minHeight: 92, justifyContent: "center", textAlign: "center" },
  doorTitle: { fontSize: 17, fontWeight: 950 },
  doorSub: { fontSize: 13, opacity: 0.92 },
  booths: { display: "grid", gap: 10 },
  booth: { padding: 16, borderRadius: 16, background: "#fff", border: "2px solid #15803d" },
  boothEmpty: { border: "2px dashed #94a3b8", background: "#f8fafc" },
  boothNo: { fontSize: 12, fontWeight: 900, color: "#64748b" },
  boothBrand: { marginTop: 6, fontSize: 13, fontWeight: 900, color: "#16a34a" },
  boothName: { marginTop: 2, fontSize: 22, fontWeight: 950, color: "#0f172a" },
  boothText: { margin: "6px 0 0", fontSize: 15, lineHeight: 1.55, color: "#334155" },
  boothRow: { marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  slot: { padding: "18px 8px", borderRadius: 12, border: "1px dashed #cbd5e1", color: "#64748b", fontSize: 13, fontWeight: 800, textAlign: "center" },
  boothBtn: { marginTop: 12, display: "block", padding: "14px 12px", borderRadius: 12, background: "#15803d", color: "#fff", fontWeight: 900, fontSize: 16, textAlign: "center", textDecoration: "none" },
  live: { padding: 16, borderRadius: 16, background: "#fff7ed", border: "2px solid #fb923c" },
  liveTitle: { fontSize: 18, fontWeight: 950, color: "#7c2d12" },
  liveText: { margin: "6px 0 0", fontSize: 15, lineHeight: 1.55, color: "#7c2d12" },
  liveBtn: { marginTop: 12, display: "inline-block", padding: "12px 16px", borderRadius: 12, background: "#ea580c", color: "#fff", fontWeight: 900, textDecoration: "none" },
  more: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  moreLink: { padding: "14px 10px", borderRadius: 12, background: "#f1f5f9", color: "#0f172a", fontWeight: 900, textAlign: "center", textDecoration: "none" },
};
