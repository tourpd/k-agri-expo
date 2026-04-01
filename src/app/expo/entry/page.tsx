// src/app/expo/entry/page.tsx
"use client";

import { useState } from "react";

export default function ExpoEntryPage() {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const form = e.currentTarget;
    const fd = new FormData(form);

    const name = String(fd.get("name") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    if (!name || !phone) return;

    setLoading(true);

    const res = await fetch("/api/expo/entry", {
      method: "POST",
      body: fd,
      redirect: "follow",
    });

    // ✅ 핵심: fetch는 주소창을 안 바꾸니, 성공하면 우리가 이동시킨다
    if (res.ok) {
      window.location.href = "/expo/hall/agri-inputs";
      return;
    }

    setLoading(false);
    alert("입장 등록 실패. (서버 응답 확인 필요)");
  }

  return (
    <form onSubmit={onSubmit}>
      <input name="role" defaultValue="farmer" />
      <input name="name" placeholder="이름" required />
      <input name="phone" placeholder="전화번호" required />
      <input name="region" placeholder="지역" />
      <input name="crop" placeholder="주요 작물" />
      <button type="submit" disabled={loading}>
        {loading ? "처리중..." : "입장하기"}
      </button>
    </form>
  );
}