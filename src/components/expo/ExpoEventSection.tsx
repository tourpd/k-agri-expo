export default function ExpoEventSection() {
  return (
    <section style={{
      margin: "30px auto",
      maxWidth: "900px",
      padding: "20px",
      borderRadius: "16px",
      background: "#0f172a",
      color: "white"
    }}>
      <h2 style={{ fontSize: "20px", fontWeight: 900 }}>
        K-Agri Expo 이벤트
      </h2>

      <div style={{ marginTop: "12px", fontWeight: 700 }}>
        🚜 영진로타리 신제품 출시 이벤트 진행중
      </div>

      <button style={{
        marginTop: "12px",
        padding: "10px 16px",
        background: "#f59e0b",
        borderRadius: "10px",
        fontWeight: 900
      }}>
        참여하기
      </button>
    </section>
  );
}
