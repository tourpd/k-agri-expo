"use client";

import { useState } from "react";

export default function MvpTestButton() {
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const base64 = reader.result;

        const res = await fetch("/api/farm/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: base64, // ✅ 핵심 수정
            farm_id: "demo-farm-001",
          }),
        });

        const data = await res.json();

        alert(`분석 결과:\n${JSON.stringify(data, null, 2)}`);
      } catch (err) {
        alert("업로드 실패");
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
      <input type="file" accept="image/*" onChange={handleFile} />

      <p style={{ marginTop: 10 }}>
        {loading ? "AI 분석 중..." : "사진 선택"}
      </p>
    </div>
  );
}
