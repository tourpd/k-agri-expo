export const dynamic = "force-dynamic";

export default function InsectConsultPage() {
  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900 }}>
        🐛 미래 곤충관
      </h1>

      <p style={{ marginTop: 12, fontSize: 18, lineHeight: 1.7 }}>
        고소애 사육, 메디푸드, 곤충산업단지 관련 교육 영상과
        사업 정보를 확인하는 페이지입니다.
      </p>

      <div style={{ marginTop: 24, display: "grid", gap: 12 }}>
        <a
          href="https://youtu.be/q9Fm3p6rpkE"
          target="_blank"
          style={btn}
        >
          📺 고소애 사육법 영상 보기
        </a>

        <a
          href="https://youtu.be/LWBGYMdMRtI"
          target="_blank"
          style={btn}
        >
          📺 메디푸드 영상 보기
        </a>

        <a
          href="https://youtu.be/dAJIOy6cjTI"
          target="_blank"
          style={btn}
        >
          📺 곤충산업단지 영상 보기
        </a>

        <a
          href="https://hanminutrition.com/"
          target="_blank"
          style={btnDark}
        >
          🏢 한미양행 공식 홈페이지
        </a>

        <a
          href="https://smartstore.naver.com/kffr"
          target="_blank"
          style={btnDark}
        >
          🌱 KFFR 공식몰
        </a>
      </div>
    </main>
  );
}

const btn: React.CSSProperties = {
  display: "block",
  padding: "16px 18px",
  borderRadius: 16,
  background: "#dcfce7",
  color: "#166534",
  fontWeight: 900,
  textDecoration: "none",
};

const btnDark: React.CSSProperties = {
  display: "block",
  padding: "16px 18px",
  borderRadius: 16,
  background: "#166534",
  color: "white",
  fontWeight: 900,
  textDecoration: "none",
};