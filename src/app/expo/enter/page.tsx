import React from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ExpoEnterPage() {
  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <section style={S.hero}>
          <div style={S.eyebrow}>K-AGRI 365 EXPO ENTRY</div>
          <h1 style={S.title}>이용 목적에 맞게 입장하세요</h1>
          <p style={S.desc}>
            농민은 특가와 상담, 업체는 부스 운영과 홍보, 바이어는 한국 농업 제품 탐색과
            문의를 바로 시작할 수 있습니다.
          </p>
        </section>

        <section style={S.grid}>
          <div style={{ ...S.card, ...S.farmerCard }}>
            <div style={S.cardEmoji}>👨‍🌾</div>
            <div style={S.cardLabel}>FARMER</div>
            <h2 style={S.cardTitle}>농민 입장</h2>
            <div style={S.cardText}>
              경품, 현장 특가, 농사 AI 상담, 포토닥터, 인기제품을 바로 확인합니다.
            </div>

            <div style={S.cardButtonRow}>
              <Link href="/expo" style={S.primaryBtn}>
                엑스포 바로가기
              </Link>
              <Link href="/login/farmer" style={S.ghostBtn}>
                농민 로그인
              </Link>
            </div>

            <div style={S.smallNote}>
              대부분 둘러보기는 로그인 없이 가능하고, 참여/주문 시 로그인합니다.
            </div>
          </div>

          <div style={{ ...S.card, ...S.vendorCard }}>
            <div style={S.cardEmoji}>🏢</div>
            <div style={S.cardLabel}>VENDOR</div>
            <h2 style={S.cardTitle}>업체 입장</h2>
            <div style={S.cardText}>
              부스 편집, 제품 등록, 영상/카탈로그 업로드, 이벤트/홍보 신청, 리드 관리를
              진행합니다.
            </div>

            <div style={S.cardButtonRow}>
              <Link href="/login/vendor" style={S.primaryBtnDark}>
                업체 로그인
              </Link>
              <Link href="/expo/vendor" style={S.ghostBtn}>
                업체 대시보드
              </Link>
            </div>

            <div style={S.smallNote}>
              업체 운영 화면은 로그인 후 이용 가능합니다.
            </div>
          </div>

          <div style={{ ...S.card, ...S.buyerCard }}>
            <div style={S.cardEmoji}>🤝</div>
            <div style={S.cardLabel}>BUYER</div>
            <h2 style={S.cardTitle}>바이어 입장</h2>
            <div style={S.cardText}>
              한국 농업 제품과 업체를 탐색하고, 카탈로그 확인과 문의/견적 요청을 진행합니다.
            </div>

            <div style={S.cardButtonRow}>
              <Link href="/login/buyer" style={S.primaryBtnBlue}>
                바이어 로그인
              </Link>
              <Link href="/buyer" style={S.ghostBtn}>
                바이어 홈
              </Link>
            </div>

            <div style={S.smallNote}>
              제품 탐색은 자유롭게, 문의와 견적 요청은 로그인 후 진행합니다.
            </div>
          </div>
        </section>

        <section style={S.bottomBox}>
          <div style={S.bottomTitle}>빠른 이동</div>
          <div style={S.bottomLinks}>
            <Link href="/expo" style={S.quickLink}>
              엑스포 홈
            </Link>
            <Link href="/expo/deals" style={S.quickLink}>
              EXPO 특가
            </Link>
            <Link href="/expo/booths" style={S.quickLink}>
              참가기업 부스
            </Link>
            <Link href="/login/admin" style={S.quickLink}>
              관리자 로그인
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
    padding: 24,
  },
  wrap: {
    maxWidth: 1280,
    margin: "0 auto",
  },
  hero: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 28,
    padding: "32px 28px",
    boxShadow: "0 14px 34px rgba(15,23,42,0.05)",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
    letterSpacing: 0.5,
  },
  title: {
    marginTop: 10,
    fontSize: "clamp(32px, 5vw, 54px)",
    lineHeight: 1.05,
    fontWeight: 950,
    color: "#0f172a",
    letterSpacing: -1,
  },
  desc: {
    marginTop: 14,
    maxWidth: 900,
    fontSize: 17,
    lineHeight: 1.9,
    color: "#475569",
  },
  grid: {
    marginTop: 22,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 18,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    border: "1px solid #e5e7eb",
    boxShadow: "0 14px 34px rgba(15,23,42,0.05)",
    background: "#fff",
  },
  farmerCard: {
    background: "linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)",
  },
  vendorCard: {
    background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
  },
  buyerCard: {
    background: "linear-gradient(180deg, #fff7ed 0%, #ffffff 100%)",
  },
  cardEmoji: {
    fontSize: 34,
  },
  cardLabel: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: 950,
    letterSpacing: 0.4,
    color: "#64748b",
  },
  cardTitle: {
    marginTop: 8,
    fontSize: 30,
    fontWeight: 950,
    color: "#0f172a",
    letterSpacing: -0.6,
  },
  cardText: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 1.8,
    color: "#475569",
    minHeight: 110,
  },
  cardButtonRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 18,
  },
  primaryBtn: {
    textDecoration: "none",
    background: "#15803d",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: 12,
    fontWeight: 900,
  },
  primaryBtnDark: {
    textDecoration: "none",
    background: "#0f172a",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: 12,
    fontWeight: 900,
  },
  primaryBtnBlue: {
    textDecoration: "none",
    background: "#2563eb",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: 12,
    fontWeight: 900,
  },
  ghostBtn: {
    textDecoration: "none",
    background: "#fff",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    padding: "12px 16px",
    borderRadius: 12,
    fontWeight: 900,
  },
  smallNote: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 1.7,
    color: "#64748b",
  },
  bottomBox: {
    marginTop: 22,
    borderRadius: 24,
    padding: 22,
    background: "#fff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 14px 34px rgba(15,23,42,0.05)",
  },
  bottomTitle: {
    fontSize: 18,
    fontWeight: 900,
    color: "#0f172a",
  },
  bottomLinks: {
    marginTop: 14,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  quickLink: {
    textDecoration: "none",
    background: "#f8fafc",
    color: "#0f172a",
    border: "1px solid #e2e8f0",
    padding: "12px 16px",
    borderRadius: 12,
    fontWeight: 900,
  },
};