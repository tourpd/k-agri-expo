import Link from "next/link";

export const dynamic = "force-dynamic";

export default function LoginIndexPage() {
  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <header style={S.header}>
          <Link href="/" style={S.brand}>
            <div style={S.brandLogo}>K</div>
            <div>
              <div style={S.brandTitle}>K-Agri Expo</div>
              <div style={S.brandSub}>대한민국 농업 온라인 박람회</div>
            </div>
          </Link>

          <div style={S.headerRight}>
            <Link href="/login/admin" style={S.adminLink}>
              관리자 로그인
            </Link>
          </div>
        </header>

        <section style={S.hero}>
          <div style={S.kicker}>ENTRY</div>
          <h1 style={S.title}>이용 목적에 맞게 입장하세요</h1>
          <p style={S.desc}>
            농민은 특가와 경품 이벤트를 보고,
            참가기업은 부스를 운영하고,
            바이어는 참가 기업을 탐색합니다.
          </p>
        </section>

        <section style={S.grid}>
          <Link href="/login/farmer" style={{ ...S.card, ...S.farmerCard }}>
            <div style={S.cardIcon}>🌾</div>
            <div style={S.cardLabel}>FARMER</div>
            <div style={S.cardTitle}>농민 입장</div>
            <div style={S.cardDesc}>특가 · 경품 · 라이브쇼</div>
            <div style={S.cardCta}>바로 입장 →</div>
          </Link>

          <Link href="/login/vendor" style={{ ...S.card, ...S.vendorCard }}>
            <div style={S.cardIcon}>🏢</div>
            <div style={S.cardLabel}>VENDOR</div>
            <div style={S.cardTitle}>참가기업 입장</div>
            <div style={S.cardDesc}>부스 운영 · 제품 등록 · 홍보</div>
            <div style={S.cardCta}>부스 열기 →</div>
          </Link>

          <Link href="/login/buyer" style={{ ...S.card, ...S.buyerCard }}>
            <div style={S.cardIcon}>🤝</div>
            <div style={S.cardLabel}>BUYER</div>
            <div style={S.cardTitle}>바이어 입장</div>
            <div style={S.cardDesc}>참가 기업 탐색 · 상담 문의</div>
            <div style={S.cardCta}>기업 찾기 →</div>
          </Link>
        </section>

        <section style={S.noteBox}>
          <div style={S.noteTitle}>안내</div>
          <div style={S.noteText}>
            관리자 화면은 일반 입장 화면에 노출하지 않고,
            별도 주소 <strong>/login/admin</strong> 에서만 로그인하도록 운영하는 것이 좋습니다.
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
    color: "#0f172a",
    padding: "28px 18px 60px",
  },
  wrap: {
    maxWidth: 1280,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  brand: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    textDecoration: "none",
    color: "#0f172a",
  },
  brandLogo: {
    width: 46,
    height: 46,
    borderRadius: 14,
    background: "linear-gradient(135deg, #16a34a 0%, #0f766e 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: 950,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: 950,
    letterSpacing: -0.4,
  },
  brandSub: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748b",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
  },
  adminLink: {
    textDecoration: "none",
    color: "#475569",
    border: "1px solid #e2e8f0",
    background: "#fff",
    padding: "10px 14px",
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 14,
  },
  hero: {
    marginTop: 34,
    textAlign: "center",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
    letterSpacing: 0.4,
  },
  title: {
    margin: "10px 0 0",
    fontSize: 44,
    lineHeight: 1.08,
    fontWeight: 950,
    letterSpacing: -1,
  },
  desc: {
    maxWidth: 760,
    margin: "16px auto 0",
    fontSize: 16,
    lineHeight: 1.9,
    color: "#64748b",
  },
  grid: {
    marginTop: 32,
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 18,
  },
  card: {
    minHeight: 320,
    borderRadius: 30,
    padding: 28,
    textDecoration: "none",
    color: "#0f172a",
    boxShadow: "0 18px 40px rgba(15,23,42,0.07)",
    border: "1px solid rgba(255,255,255,0.7)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    transition: "transform 0.2s ease",
  },
  farmerCard: {
    background: "linear-gradient(180deg, #ecfdf5 0%, #dcfce7 100%)",
  },
  vendorCard: {
    background: "linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)",
  },
  buyerCard: {
    background: "linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%)",
  },
  cardIcon: {
    fontSize: 42,
    lineHeight: 1,
  },
  cardLabel: {
    marginTop: 18,
    fontSize: 13,
    fontWeight: 950,
    letterSpacing: 0.4,
    color: "#334155",
  },
  cardTitle: {
    marginTop: 14,
    fontSize: 36,
    lineHeight: 1.05,
    fontWeight: 950,
    letterSpacing: -0.8,
  },
  cardDesc: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 1.8,
    color: "#334155",
  },
  cardCta: {
    marginTop: 26,
    fontSize: 18,
    fontWeight: 950,
  },
  noteBox: {
    marginTop: 26,
    borderRadius: 22,
    padding: 18,
    background: "#fff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 950,
  },
  noteText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 1.8,
    color: "#64748b",
  },
};