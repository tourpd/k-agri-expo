import Link from "next/link";

export default function PhotoDoctorBanner() {
  return (
    <section style={wrap}>
      <div style={badge}>PHOTO DOCTOR INSIDE K-AGRI EXPO</div>

      <div style={content}>
        <div style={left}>
          <div style={appIconWrap}>
            <img
              src="/photodoctor_app_icon_1024.png"
              alt="포토닥터 앱 아이콘"
              style={appIcon}
            />
          </div>

          <div>
            <h2 style={title}>포토닥터</h2>

            <div style={headline}>
              사진 한 장으로
              <br />
              병해충·생육 상태 AI 진단
            </div>

            <div style={desc}>
              진단 결과 기반으로
              <br />
              대응 방법과 추천 자재까지
              <br />
              바로 확인할 수 있습니다.
            </div>

            <div style={miniInfo}>
              ✔ 병해충 AI 분석
              <br />
              ✔ 생육 이상 원인 분석
              <br />
              ✔ 추천 대응 자재 연결
            </div>
          </div>
        </div>

        <div style={right}>
          <Link href="/ai-consult" style={primaryBtn}>
            포토닥터 시작하기 →
          </Link>

          <div style={subText}>
            K-Agri Expo 내부 진단 시스템으로 이동합니다
          </div>
        </div>
      </div>
    </section>
  );
}

const wrap: React.CSSProperties = {
  borderRadius: 36,
  padding: 36,
  background:
    "linear-gradient(135deg, #07162f 0%, #0a2346 45%, #0c6a3b 100%)",
  color: "#fff",
  boxShadow: "0 20px 50px rgba(15,23,42,0.18)",
  overflow: "hidden",
  position: "relative",
};

const badge: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 18px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.12)",
  color: "#bbf7d0",
  fontWeight: 900,
  fontSize: 13,
  letterSpacing: 0.6,
};

const content: React.CSSProperties = {
  marginTop: 28,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 32,
  flexWrap: "wrap",
};

const left: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 30,
  flexWrap: "wrap",
};

const appIconWrap: React.CSSProperties = {
  width: 200,
  height: 200,
  borderRadius: 36,
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
  flexShrink: 0,
};

const appIcon: React.CSSProperties = {
  width: 126,
  height: 126,
  objectFit: "contain",
};

const title: React.CSSProperties = {
  margin: 0,
  fontSize: 76,
  lineHeight: 1,
  fontWeight: 950,
  color: "#fff",
};

const headline: React.CSSProperties = {
  marginTop: 18,
  fontSize: 34,
  lineHeight: 1.45,
  fontWeight: 950,
  color: "#fff",
};

const desc: React.CSSProperties = {
  marginTop: 22,
  fontSize: 20,
  lineHeight: 1.9,
  color: "rgba(255,255,255,0.92)",
  fontWeight: 700,
};

const miniInfo: React.CSSProperties = {
  marginTop: 24,
  padding: "16px 18px",
  borderRadius: 18,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  fontSize: 16,
  lineHeight: 1.9,
  fontWeight: 700,
  color: "#d1fae5",
  width: "fit-content",
};

const right: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 14,
};

const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 320,
  minHeight: 86,
  padding: "0 34px",
  borderRadius: 24,
  background: "#ffffff",
  color: "#0f172a",
  textDecoration: "none",
  fontWeight: 950,
  fontSize: 26,
  boxShadow: "0 16px 36px rgba(255,255,255,0.16)",
  transition: "all .2s ease",
};

const subText: React.CSSProperties = {
  fontSize: 15,
  color: "rgba(255,255,255,0.72)",
  fontWeight: 700,
};