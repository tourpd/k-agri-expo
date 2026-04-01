import Link from "next/link";

export default function PhotoDoctorBanner() {
  return (
    <section style={wrap}>
      <div style={badge}>PHOTO DOCTOR</div>

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
              사진 한 장으로 작물 상태 진단
            </div>

            <div style={desc}>
              작물이 이상할 때
              <br />
              원인을 모를 때
              <br />
              지금 바로 확인하세요
            </div>
          </div>
        </div>

        <div style={right}>
          <Link href="/ai-consult" style={primaryBtn}>
            포토닥터 시작 →
          </Link>
        </div>
      </div>
    </section>
  );
}

const wrap: React.CSSProperties = {
  borderRadius: 36,
  padding: 36,
  background: "linear-gradient(90deg, #08142f 0%, #0c203f 45%, #0d5b33 100%)",
  color: "#fff",
  boxShadow: "0 16px 40px rgba(15,23,42,0.12)",
};

const badge: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 18px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.14)",
  color: "#b7f7cb",
  fontWeight: 900,
  fontSize: 14,
  letterSpacing: 0.4,
};

const content: React.CSSProperties = {
  marginTop: 28,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 24,
  flexWrap: "wrap",
};

const left: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 28,
  flexWrap: "wrap",
};

const appIconWrap: React.CSSProperties = {
  width: 194,
  height: 194,
  borderRadius: 30,
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 18px 36px rgba(0,0,0,0.18)",
};

const appIcon: React.CSSProperties = {
  width: 120,
  height: 120,
  objectFit: "contain",
};

const title: React.CSSProperties = {
  margin: 0,
  fontSize: 72,
  lineHeight: 1.02,
  fontWeight: 950,
  color: "#fff",
};

const headline: React.CSSProperties = {
  marginTop: 18,
  fontSize: 32,
  lineHeight: 1.45,
  fontWeight: 950,
  color: "#fff",
  maxWidth: 720,
};

const desc: React.CSSProperties = {
  marginTop: 22,
  fontSize: 18,
  lineHeight: 1.9,
  color: "rgba(255,255,255,0.9)",
  fontWeight: 600,
};

const right: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
};

const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "22px 34px",
  borderRadius: 22,
  background: "#fff",
  color: "#0f172a",
  textDecoration: "none",
  fontWeight: 950,
  fontSize: 22,
  boxShadow: "0 12px 28px rgba(255,255,255,0.12)",
};