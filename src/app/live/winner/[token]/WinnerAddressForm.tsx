"use client";

import { useState } from "react";

export default function WinnerAddressForm({
  token,
  winner,
}: {
  token: string;
  winner: any;
}) {
  const [form, setForm] = useState({
    receiver_name: winner.winner_name || "",
    receiver_phone: winner.winner_phone || "",
    zipcode: "",
    address1: "",
    address2: "",
    delivery_memo: "",
    privacy_agreed: false,
  });

  const [message, setMessage] = useState("");

  function update(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    if (!form.receiver_name.trim()) return setMessage("수령자 이름을 입력해주세요.");
    if (!form.receiver_phone.trim()) return setMessage("연락처를 입력해주세요.");
    if (!form.address1.trim()) return setMessage("주소를 입력해주세요.");
    if (!form.privacy_agreed) return setMessage("개인정보 제공 동의가 필요합니다.");

    const res = await fetch("/api/live/winner-address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...form }),
    });

    const data = await res.json();

    if (!data?.ok) {
      setMessage(data?.error || "저장 실패");
      return;
    }

    setMessage("배송정보가 저장되었습니다. 감사합니다.");
  }

  return (
    <main style={S.page}>
      <section style={S.card}>
        <p style={S.kicker}>K-Agri Expo LIVE</p>
        <h1 style={S.title}>경품 배송정보 입력</h1>

        <div style={S.prizeBox}>
          <b>당첨 경품</b>
          <strong>{winner.prize_title || "라이브 경품"}</strong>
          <span>당첨번호 {String(winner.draw_number || "-").padStart(4, "0")}</span>
        </div>

        {message && <div style={S.message}>{message}</div>}

        <label style={S.label}>수령자 이름</label>
        <input style={S.input} value={form.receiver_name} onChange={(e) => update("receiver_name", e.target.value)} />

        <label style={S.label}>연락처</label>
        <input style={S.input} value={form.receiver_phone} onChange={(e) => update("receiver_phone", e.target.value)} />

        <label style={S.label}>우편번호</label>
        <input style={S.input} value={form.zipcode} onChange={(e) => update("zipcode", e.target.value)} placeholder="예: 10372" />

        <label style={S.label}>주소</label>
        <input style={S.input} value={form.address1} onChange={(e) => update("address1", e.target.value)} placeholder="예: 경기도 고양시 일산서구 ..." />

        <label style={S.label}>상세주소</label>
        <input style={S.input} value={form.address2} onChange={(e) => update("address2", e.target.value)} placeholder="동/호수, 상세주소" />

        <label style={S.label}>배송 메모</label>
        <textarea style={S.textarea} value={form.delivery_memo} onChange={(e) => update("delivery_memo", e.target.value)} />

        <label style={S.check}>
          <input
            type="checkbox"
            checked={form.privacy_agreed}
            onChange={(e) => update("privacy_agreed", e.target.checked)}
          />
          <span>경품 배송을 위해 협찬사 또는 배송업체에 개인정보를 제공하는 것에 동의합니다.</span>
        </label>

        <button type="button" onClick={submit} style={S.button}>
          배송정보 제출
        </button>
      </section>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: 18,
    color: "#111827",
  },
  card: {
    maxWidth: 620,
    margin: "0 auto",
    background: "white",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 18px 40px rgba(15,23,42,0.1)",
  },
  kicker: {
    margin: 0,
    color: "#2563eb",
    fontWeight: 950,
  },
  title: {
    fontSize: 32,
    fontWeight: 950,
  },
  prizeBox: {
    display: "grid",
    gap: 6,
    padding: 16,
    borderRadius: 16,
    background: "#eff6ff",
    marginBottom: 16,
  },
  message: {
    padding: 14,
    borderRadius: 14,
    background: "#eef2ff",
    color: "#1e3a8a",
    fontWeight: 900,
    marginBottom: 14,
  },
  label: {
    display: "block",
    margin: "14px 0 7px",
    fontWeight: 900,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: 15,
    fontSize: 18,
  },
  textarea: {
    width: "100%",
    minHeight: 90,
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: 15,
    fontSize: 18,
  },
  check: {
    display: "flex",
    gap: 10,
    marginTop: 16,
    fontWeight: 800,
    lineHeight: 1.5,
  },
  button: {
    width: "100%",
    marginTop: 18,
    border: 0,
    borderRadius: 16,
    padding: 18,
    background: "#16a34a",
    color: "white",
    fontSize: 20,
    fontWeight: 950,
  },
};