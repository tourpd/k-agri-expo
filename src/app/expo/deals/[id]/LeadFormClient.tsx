// src/app/expo/[dealId]/LeadFormClient.tsx
"use client";

import React from "react";

export default function LeadFormClient({
  deal_id,
  membership_used,
  onSuccess,
}: {
  deal_id: string;
  membership_used: boolean;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    const payload = {
      deal_id,
      name: String(fd.get("name") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      region: String(fd.get("region") || "").trim(),
      tractor_hp: String(fd.get("tractor_hp") || "").trim(),
      source: "youtube_qr",
      membership_used,
    };

    try {
      const res = await fetch("/api/expo/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      setLoading(false);

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setMsg(`접수 실패. ${t || "입력값을 확인해 주십시오."}`);
        return;
      }

      setMsg("접수 완료! 업체에서 연락드립니다.");
      // ✅ reset은 이벤트 객체에서 안전하게
      e.currentTarget.reset();
      onSuccess?.();
    } catch (err: any) {
      setLoading(false);
      setMsg(`접수 실패. 네트워크/서버 오류: ${err?.message || String(err)}`);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ marginTop: 14, display: "grid", gap: 12 }}>
      <input name="name" placeholder="성함" required style={inp} />
      <input name="phone" placeholder="휴대폰 번호" required style={inp} />
      <input name="region" placeholder="지역(예: 충남 홍성)" style={inp} />
      <input name="tractor_hp" placeholder="보유 트랙터 마력(선택)" style={inp} />

      <button disabled={loading} style={btnPrimary}>
        {loading ? "접수 중..." : "상담 신청하기"}
      </button>

      {msg ? <div style={{ fontSize: 15, fontWeight: 950 }}>{msg}</div> : null}
      <div style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>
        * 개인정보는 상담 목적 외 사용하지 않습니다.
      </div>
    </form>
  );
}

/* 고령층/모바일 입력 UX */
const inp: React.CSSProperties = {
  padding: 16,
  borderRadius: 16,
  border: "1px solid #d1d5db",
  outline: "none",
  fontSize: 18,
  height: 56,
};

const btnPrimary: React.CSSProperties = {
  padding: 16,
  height: 56,
  borderRadius: 16,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 950,
  fontSize: 18,
  cursor: "pointer",
};