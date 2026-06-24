"use client";

export default function PhotoDoctorLeadButton() {
  return (
    <section style={{
      margin: "20px auto",
      padding: "20px",
      maxWidth: "900px",
      borderRadius: "16px",
      background: "#f5fff7",
      border: "1px solid #cdebd3"
    }}>
      <h2 style={{ fontSize: "22px", fontWeight: 900 }}>
        포토닥터
      </h2>

      <p style={{ marginTop: "8px" }}>
        사진 한 장으로 병해충 진단 준비 영역
      </p>

      <button style={{
        marginTop: "12px",
        padding: "12px 18px",
        background: "#16a34a",
        color: "white",
        borderRadius: "10px",
        fontWeight: 800
      }}>
        사진 업로드
      </button>
    </section>
  );
}
