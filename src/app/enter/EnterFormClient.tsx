"use client";

import React from "react";

export default function EnterFormClient({ next }: { next: string }) {
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    const payload = {
      name: String(fd.get("name") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      region: String(fd.get("region") || "").trim(),
      crop: String(fd.get("crop") || "").trim(),
      role: String(fd.get("role") || "farmer").trim(), // farmer | buyer
      next,
    };

    const res = await fetch("/api/enter", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      setMsg(t || "등록 실패. 입력값을 확인해 주십시오.");
      return;
    }

    // ✅ 등록 성공 → next로 이동
    window.location.href = next || "/expo";
  }

  return (
    <form onSubmit={onSubmit} style={{ marginTop: 14, display: "grid", gap: 12 }}>
      <div style={segRow}>
        <label style={seg}>
          <input type="radio" name="role" value="farmer" defaultChecked />
          농민
        </label>
        <label style={seg}>
          <input type="radio" name="role" value="buyer" />
          바이어
        </label>
      </div>

      <input name="name" placeholder="이름 (필수)" required style={inp} />
      <input name="phone" placeholder="전화번호 (필수)" required inputMode="tel" style={inp} />

      <input name="region" placeholder="지역 (선택: 예. 충남 홍성)" style={inp} />
      <input name="crop" placeholder="주요 작물 (선택: 예. 마늘/고추/양파)" style={inp} />

      <button disabled={loading} style={btnPrimary}>
        {loading ? "등록 중..." : "등록하고 입장하기"}
      </button>

      {msg ? <div style={{ fontSize: 15, fontWeight: 950 }}>{msg}</div> : null}

      <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>
        * 개인정보는 엑스포 운영 및 상담 연결 목적 외 사용하지 않습니다.
      </div>
    </form>
  );
}

/** ✅ 고령층 UX: 입력/버튼 크게 */
const inp: React.CSSProperties = {
  height: 56,
  padding: "0 14px",
  borderRadius: 16,
  border: "2px solid #111",
  outline: "none",
  fontSize: 18,
};

const btnPrimary: React.CSSProperties = {
  height: 60,
  borderRadius: 16,
  border: "2px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 950,
  fontSize: 18,
  cursor: "pointer",
};

const segRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const seg: React.CSSProperties = {
  height: 56,
  borderRadius: 16,
  border: "2px solid #111",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  fontSize: 18,
  fontWeight: 900,
};