"use client";

import React, { useState } from "react";

export default function InquiryForm({
  boothId,
}: {
  boothId: string;
}) {
  const [farmerName, setFarmerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      if (!message.trim()) {
        setMsg("문의 내용을 입력해 주세요.");
        return;
      }

      const res = await fetch("/api/expo/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booth_id: boothId,
          farmer_name: farmerName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setMsg(data?.error ?? "상담 요청 실패");
        return;
      }

      setMsg("상담 요청이 접수되었습니다.");
      setFarmerName("");
      setPhone("");
      setEmail("");
      setMessage("");
    } catch (e: any) {
      setMsg(e?.message ?? "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={S.wrap}>
      <div style={S.kicker}>INQUIRY</div>
      <h2 style={S.title}>💬 상담 요청</h2>
      <div style={S.desc}>
        관심 있는 제품이나 견적, 사용법, 구매 문의를 남겨주시면 업체에서 확인 후 연락드립니다.
      </div>

      <form onSubmit={handleSubmit} style={S.form}>
        <input
          value={farmerName}
          onChange={(e) => setFarmerName(e.target.value)}
          placeholder="이름"
          style={S.input}
        />

        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="연락처"
          style={S.input}
        />

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          style={S.input}
        />

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="문의 내용을 입력해 주세요."
          style={S.textarea}
          required
        />

        <button type="submit" style={S.button} disabled={loading}>
          {loading ? "접수 중..." : "상담 요청 보내기"}
        </button>
      </form>

      {msg ? <div style={S.msg}>{msg}</div> : null}
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    marginTop: 30,
    padding: 20,
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    background: "#fff",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 900,
    color: "#2563eb",
  },
  title: {
    margin: "10px 0 0",
    fontSize: 24,
    fontWeight: 950,
    color: "#111827",
  },
  desc: {
    marginTop: 10,
    color: "#64748b",
    lineHeight: 1.8,
    fontSize: 14,
  },
  form: {
    marginTop: 18,
    display: "grid",
    gap: 12,
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: "1px solid #dbe2ea",
    boxSizing: "border-box",
    fontSize: 14,
  },
  textarea: {
    width: "100%",
    minHeight: 120,
    padding: "14px 16px",
    borderRadius: 12,
    border: "1px solid #dbe2ea",
    boxSizing: "border-box",
    fontSize: 14,
    resize: "vertical",
  },
  button: {
    padding: "14px 16px",
    borderRadius: 12,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
  },
  msg: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    background: "#f8fafc",
    color: "#334155",
    lineHeight: 1.7,
  },
};