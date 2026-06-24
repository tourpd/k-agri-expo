import Link from "next/link";

export default function FarmerDirectMarketEntry() {
  return (
    <section style={{ maxWidth: 1180, margin: "20px auto 0", padding: "0 20px" }}>
      <Link
        href="/expo/agri-exchange/market"
        style={{
          display: "block",
          textDecoration: "none",
          borderRadius: 26,
          overflow: "hidden",
          background: "linear-gradient(135deg, #fb923c 0%, #f97316 48%, #fed7aa 100%)",
          boxShadow: "0 20px 55px rgba(249,115,22,0.22)",
          border: "1px solid rgba(255,255,255,0.65)",
          padding: "34px 38px 22px",
          color: "#ffffff",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 950, marginBottom: 14 }}>B2C 직거래</div>
        <h2 style={{ margin: 0, fontSize: "clamp(34px, 5vw, 58px)", lineHeight: 1.06, letterSpacing: "-0.06em", fontWeight: 950 }}>
          산지직송<br />농산물 직판장
        </h2>
        <p style={{ margin: "18px 0 0", fontSize: 20, lineHeight: 1.55, fontWeight: 850 }}>
          농민이 직접 올리고 소비자가 직접 구매하는 직거래 장터
        </p>
        <div style={{ marginTop: 22, background: "rgba(255,255,255,0.78)", color: "#9a3412", borderRadius: 18, padding: "16px 18px", fontWeight: 950 }}>
          📷 사진 한 장 업로드 · 🤖 AI 상품 등록 · 🛡 안전결제 · 🚚 전국 택배
        </div>
      </Link>
    </section>
  );
}
