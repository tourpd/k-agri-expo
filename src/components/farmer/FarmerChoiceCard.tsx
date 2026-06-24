"use client";

import { useRouter } from "next/navigation";

export default function FarmerChoiceCard() {
  const router = useRouter();

  return (
    <div style={{
      background: "#ffffff",
      borderRadius: "16px",
      padding: "20px",
      border: "1px solid #e5e5e5",
      boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
    }}>
      <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "10px" }}>
        🌾 농부의 선택
      </h2>

      <p style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>
        오늘 작물을 어떻게 할지 결정하세요
      </p>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        
        <button
          onClick={() => router.push("/photodoctor")}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "10px",
            background: "#0A5F35",
            color: "#fff",
            border: "none",
            cursor: "pointer"
          }}
        >
          📸 상태 진단
        </button>

        <button
          onClick={() => router.push("/market")}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "10px",
            background: "#1f6fff",
            color: "#fff",
            border: "none",
            cursor: "pointer"
          }}
        >
          📊 시장 확인
        </button>

        <button
          onClick={() => router.push("/order")}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "10px",
            background: "#ff8a00",
            color: "#fff",
            border: "none",
            cursor: "pointer"
          }}
        >
          🚚 출하 결정
        </button>

        <button
          onClick={() => router.push("/my-farm")}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
            border: "none",
            cursor: "pointer"
          }}
        >
          🌱 내 농장
        </button>

      </div>
    </div>
  );
}
