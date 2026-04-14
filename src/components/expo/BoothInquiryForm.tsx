"use client";

import { useState } from "react";

export default function BoothInquiryForm({
  boothId,
  vendorId = "",
  hallId = "",
  slotCode = "",
}: {
  boothId: string;
  vendorId?: string;
  hallId?: string;
  slotCode?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    user_name: "",
    phone: "",
    region: "",
    crop: "",
    message: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/expo/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booth_id: boothId,
          vendor_id: vendorId || null,
          hall_id: hallId || null,
          slot_code: slotCode || null,
          ...form,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "문의 접수에 실패했습니다.");
      }

      setDone(true);
      setForm({
        user_name: "",
        phone: "",
        region: "",
        crop: "",
        message: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "문의 접수 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          background: "#ecfdf5",
          border: "1px solid #a7f3d0",
          color: "#166534",
          fontWeight: 700,
          lineHeight: 1.7,
        }}
      >
        문의가 정상 접수되었습니다. 업체가 확인 후 연락드립니다.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        <input
          value={form.user_name}
          onChange={(e) => setForm((prev) => ({ ...prev, user_name: e.target.value }))}
          placeholder="이름"
          style={inputStyle}
        />
        <input
          value={form.phone}
          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          placeholder="연락처"
          style={inputStyle}
        />
        <input
          value={form.region}
          onChange={(e) => setForm((prev) => ({ ...prev, region: e.target.value }))}
          placeholder="지역"
          style={inputStyle}
        />
        <input
          value={form.crop}
          onChange={(e) => setForm((prev) => ({ ...prev, crop: e.target.value }))}
          placeholder="작물"
          style={inputStyle}
        />
      </div>

      <textarea
        value={form.message}
        onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
        placeholder="문의 내용"
        style={{
          ...inputStyle,
          minHeight: 140,
          resize: "vertical",
        }}
      />

      {error ? (
        <div
          style={{
            color: "#dc2626",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        style={{
          height: 48,
          border: "none",
          borderRadius: 10,
          background: "#111827",
          color: "#fff",
          fontWeight: 900,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "접수 중..." : "문의 접수하기"}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 10,
  padding: "12px 14px",
  fontSize: 14,
  outline: "none",
  background: "#fff",
};