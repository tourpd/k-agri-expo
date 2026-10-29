import MvpUploadBox from "@/components/expo/MvpUploadBox";

export default function ExpoPage() {
  return (
    <main
      style={{
        padding: 24,
        background: "#ffffff",
        color: "#111111",
        minHeight: "100vh",
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>
        AI 농사비서 MVP
      </h1>

      <p style={{ marginTop: 8, color: "#444" }}>
        사진을 업로드하면 AI가 병해를 분석합니다
      </p>

      <div style={{ marginTop: 20 }}>
        <MvpUploadBox />
      </div>
    </main>
  );
}