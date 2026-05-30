"use client";

import { useState } from "react";

export default function ExpoAdminPage() {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/live/product-image", {
      method: "POST",
      body: formData,
    });

    const json = await res.json();

    if (json.ok) {
      setImageUrl(json.url);
      alert("업로드 완료");
    } else {
      alert(json.error || "업로드 실패");
    }

    setUploading(false);
  }

  return (
    <main style={{ padding: 40 }}>
      <h1 style={{ fontSize: 30, fontWeight: 900 }}>
        🔧 라이브 관리자
      </h1>

      {/* 🔥 이미지 업로드 */}
      <div style={{ marginTop: 30 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900 }}>
          📸 제품 이미지 업로드
        </h2>

        <input
          type="file"
          onChange={upload}
          disabled={uploading}
          style={{ marginTop: 10 }}
        />

        {uploading && <p>업로드 중...</p>}

        {imageUrl && (
          <div style={{ marginTop: 20 }}>
            <img
              src={imageUrl}
              style={{
                width: "100%",
                maxWidth: 400,
                borderRadius: 12,
              }}
            />
          </div>
        )}
      </div>
    </main>
  );
}