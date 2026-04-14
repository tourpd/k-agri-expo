import Link from "next/link";

export const dynamic = "force-dynamic";

export default function VendorHome() {
  return (
    <main style={S.page}>
      <div style={S.card}>
        <div style={S.kicker}>VENDOR DASHBOARD</div>

        <h1 style={S.title}>기업 대시보드</h1>

        <p style={S.desc}>
          환영합니다. 부스를 생성하고 제품을 등록해 매출을 시작하세요.
        </p>

        <div style={S.buttonGroup}>
          <Link href="/vendor/apply" style={S.primaryBtn}>
            입점 신청하기 →
          </Link>

          <Link href="/vendor/booth" style={S.secondaryBtn}>
            내 부스 관리 →
          </Link>
        </div>

        <div style={S.infoBox}>
          <div style={S.infoTitle}>진행 단계</div>
          <ul style={S.infoList}>
            <li>1️⃣ 입점 신청</li>
            <li>2️⃣ 관리자 승인</li>
            <li>3️⃣ 부스 생성</li>
            <li>4️⃣ 상품 등록 및 판매 시작</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 720,
    background: "#fff",
    borderRadius: 24,
    padding: 32,
    boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 900,
    color: "#2563eb",
  },
  title: {
    marginTop: 10,
    fontSize: 34,
    fontWeight: 950,
    color: "#111",
  },
  desc: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 1.8,
    color: "#64748b",
  },
  buttonGroup: {
    marginTop: 24,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  primaryBtn: {
    textDecoration: "none",
    background: "#111",
    color: "#fff",
    padding: "14px 18px",
    borderRadius: 12,
    fontWeight: 900,
  },
  secondaryBtn: {
    textDecoration: "none",
    background: "#fff",
    color: "#111",
    border: "1px solid #ddd",
    padding: "14px 18px",
    borderRadius: 12,
    fontWeight: 900,
  },
  infoBox: {
    marginTop: 28,
    padding: 18,
    borderRadius: 16,
    background: "#f1f5f9",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 900,
    marginBottom: 8,
  },
  infoList: {
    margin: 0,
    paddingLeft: 16,
    fontSize: 14,
    color: "#475569",
    lineHeight: 1.8,
  },
};