"use client";

export default function PhotoDoctorBanner() {
  const openApp = () => {
    window.open("https://plant-doctor-app.vercel.app/", "_blank");
  };

  return (
    <section style={S.wrap}>
      <div style={S.left}>
        <div style={S.eyebrow}>PHOTODOCTOR APP</div>

        <h2 style={S.title}>
          📷 사진 한 장이면
          <br />
          당신의 작물을 AI가 진단합니다
        </h2>

        <p style={S.desc}>
          포토닥터를 열고 작물 사진을 올리면 병해 진단과 대응 방향을 빠르게
          확인할 수 있습니다. 스마트폰에서 바로 실행해 보세요.
        </p>

        <div style={S.buttonRow}>
          <button onClick={openApp} style={S.primaryBtn}>
            포토닥터 열기 →
          </button>

          <a
            href="https://plant-doctor-app.vercel.app/"
            target="_blank"
            rel="noreferrer"
            style={S.secondaryBtn}
          >
            웹으로 바로 접속
          </a>
        </div>
      </div>

      <div style={S.right}>
        <img
          src="/photodoctor_app_icon_1024.png"
          alt="포토닥터 앱 아이콘"
          style={S.icon}
        />

        <div style={S.appName}>포토닥터</div>

        <div style={S.rightText}>
          스마트폰에서 바로 실행해
          <br />
          병해를 빠르게 확인해 보세요
        </div>
      </div>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    width: "100%",
    borderRadius: 28,
    overflow: "hidden",
    background: "linear-gradient(135deg, #071525 0%, #0b2b3d 35%, #0f5b2e 100%)",
    color: "#ffffff",
    padding: "30px 34px",
    display: "grid",
    gridTemplateColumns: "1.45fr 0.55fr",
    gap: 24,
    alignItems: "center",
    boxShadow: "0 18px 40px rgba(15,23,42,0.12)",
  },

  left: {
    minWidth: 0,
  },

  eyebrow: {
    fontSize: 13,
    letterSpacing: 1,
    color: "#a7f3d0",
    fontWeight: 900,
  },

  title: {
    margin: "14px 0 0",
    fontSize: 52,
    lineHeight: 1.16,
    fontWeight: 950,
    letterSpacing: -1.2,
    maxWidth: 860,
  },

  desc: {
    marginTop: 20,
    fontSize: 17,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 1.75,
    maxWidth: 760,
  },

  buttonRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 24,
  },

  primaryBtn: {
    background: "#ffffff",
    color: "#0f172a",
    borderRadius: 16,
    padding: "14px 22px",
    fontWeight: 900,
    fontSize: 17,
    cursor: "pointer",
    border: "none",
    boxShadow: "0 10px 24px rgba(15,23,42,0.14)",
  },

  secondaryBtn: {
    textDecoration: "none",
    background: "rgba(255,255,255,0.08)",
    color: "#ffffff",
    borderRadius: 16,
    padding: "14px 20px",
    fontWeight: 800,
    fontSize: 16,
    border: "1px solid rgba(255,255,255,0.14)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },

  right: {
    borderRadius: 24,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    padding: "20px 18px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
  },

  icon: {
    width: 76,
    height: 76,
    objectFit: "cover",
    borderRadius: 18,
    boxShadow: "0 8px 24px rgba(15,23,42,0.18)",
    display: "block",
  },

  appName: {
    marginTop: 12,
    fontWeight: 950,
    fontSize: 22,
    color: "#ffffff",
    letterSpacing: -0.6,
  },

  rightText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 1.7,
    color: "rgba(255,255,255,0.82)",
    fontWeight: 700,
  },
};