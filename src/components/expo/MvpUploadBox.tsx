"use client";

import { useState } from "react";

export default function MvpUploadBox() {
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
      <input
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          setLoading(true);

          const reader = new FileReader();

          reader.onload = async () => {
            try {
              // 1️⃣ 업로드 (Supabase or API)
              const res1 = await fetch("/api/farm/upload", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  image: reader.result,
                  farm_id: "demo",
                }),
              });

              const uploadData = await res1.json();
              const image_url = uploadData.image_url;

              // 2️⃣ AI 분석 (여기가 핵심 수정)
              const res2 = await fetch("/api/farm/analyze", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  image_url,   // ✅ 중요: image ❌ → image_url ✔
                  farm_id: "demo",
                }),
              });

              const data = await res2.json();

              alert(JSON.stringify(data, null, 2));
            } catch (err) {
              console.error(err);
              alert("분석 실패");
            } finally {
              setLoading(false);
            }
          };

          reader.readAsDataURL(file);
        }}
      />

      <p style={{ marginTop: 10 }}>
        {loading ? "분석중..." : "이미지 선택"}
      </p>
    </div>
  );
}
