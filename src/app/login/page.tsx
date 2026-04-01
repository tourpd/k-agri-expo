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
          <h1 style={S.title}>역할에 맞게 바로 시작하세요</h1>
          <p style={S.desc}>
            농민은 이름과 전화번호로 바로 입장하고,
            참가기업은 부스를 운영하며,
            바이어는 참가 기업을 탐색하고 상담을 진행합니다.
          </p>
        </section>

        <section style={S.grid}>
          {/* 농민 */}
          <div style={{ ...S.card, ...S.farmerCard }}>
            <div>
              <div style={S.cardIcon}>🌾</div>
              <div style={S.cardLabel}>FARMER</div>
              <div style={S.cardTitle}>농민</div>
              <div style={S.cardDesc}>
                포토닥터 · 농사 상담 · 특가 · 라이브쇼 · 경품 이벤트
              </div>
            </div>

            <div style={S.cardBottom}>
              <div style={S.cardFeature}>
                이름과 전화번호만 입력하면 바로 엑스포에 입장합니다.
              </div>
              <div style={S.actionRowSingle}>
                <Link href="/enter/farmer" style={S.primaryBtnGreen}>
                  농민 입장
                </Link>
              </div>
            </div>
          </div>

          {/* 참가기업 */}
          <div style={{ ...S.card, ...S.vendorCard }}>
            <div>
              <div style={S.cardIcon}>🏢</div>
              <div style={S.cardLabel}>VENDOR</div>
              <div style={S.cardTitle}>참가기업</div>
              <div style={S.cardDesc}>
                부스 운영 · 제품 등록 · 특가 등록 · 콘텐츠 업로드
              </div>
            </div>

            <div style={S.cardBottom}>
              <div style={S.cardFeature}>엑스포 안에서 직접 홍보하고 판매</div>
              <div style={S.actionRow}>
                <Link href="/login/vendor" style={S.primaryBtnBlue}>
                  로그인
                </Link>
                <Link href="/signup/vendor" style={S.secondaryBtnWhite}>
                  회원가입
                </Link>
              </div>
            </div>
          </div>

          {/* 바이어 */}
          <div style={{ ...S.card, ...S.buyerCard }}>
            <div>
              <div style={S.cardIcon}>🤝</div>
              <div style={S.cardLabel}>BUYER</div>
              <div style={S.cardTitle}>바이어</div>
              <div style={S.cardDesc}>
                참가 기업 탐색 · 제품 문의 · 업체 상담 · 구매 연결
              </div>
            </div>

            <div style={S.cardBottom}>
              <div style={S.cardFeature}>원하는 기업과 빠르게 연결</div>
              <div style={S.actionRow}>
                <Link href="/login/buyer" style={S.primaryBtnOrange}>
                  로그인
                </Link>
                <Link href="/register/buyer" style={S.secondaryBtnWhite}>
                  회원가입
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section style={S.noteBox}>
          <div style={S.noteTitle}>안내</div>
          <div style={S.noteText}>
            농민은 별도 로그인 없이 <strong>농민 입장</strong>으로 바로 들어가고,
            바이어/기업/관리자는 각자 전용 로그인 화면을 사용합니다.
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
    maxWidth: 840,
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
    minHeight: 360,
    borderRadius: 30,
    padding: 28,
    textDecoration: "none",
    color: "#0f172a",
    boxShadow: "0 18px 40px rgba(15,23,42,0.07)",
    border: "1px solid rgba(255,255,255,0.7)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
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
  cardBottom: {
    marginTop: 26,
  },
  cardFeature: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "#475569",
    fontWeight: 700,
  },
  actionRow: {
    marginTop: 16,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  actionRowSingle: {
    marginTop: 16,
    display: "flex",
  },
  primaryBtnGreen: {
    display: "inline-block",
    textDecoration: "none",
    padding: "12px 18px",
    borderRadius: 14,
    background: "#15803d",
    color: "#fff",
    fontWeight: 900,
    fontSize: 15,
  },
  primaryBtnBlue: {
    display: "inline-block",
    textDecoration: "none",
    padding: "12px 18px",
    borderRadius: 14,
    background: "#2563eb",
    color: "#fff",
    fontWeight: 900,
    fontSize: 15,
  },
  primaryBtnOrange: {
    display: "inline-block",
    textDecoration: "none",
    padding: "12px 18px",
    borderRadius: 14,
    background: "#ea580c",
    color: "#fff",
    fontWeight: 900,
    fontSize: 15,
  },
  secondaryBtnWhite: {
    display: "inline-block",
    textDecoration: "none",
    padding: "12px 18px",
    borderRadius: 14,
    background: "#fff",
    color: "#111",
    border: "1px solid rgba(15,23,42,0.08)",
    fontWeight: 900,
    fontSize: 15,
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