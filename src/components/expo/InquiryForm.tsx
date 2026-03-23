"use client";

import React from "react";
import { sendExpoLog } from "@/lib/expoLog";

type Props = {
  booth_id: string;
  booth_name?: string | null;
  product_id?: string | null;
  product_name?: string | null;
};

function getOrCreateSessionId() {
  if (typeof window === "undefined") return null;

  const key = "expo_session_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const created =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(key, created);
  return created;
}

export default function InquiryForm({
  booth_id,
  booth_name = null,
  product_id = null,
  product_name = null,
}: Props) {
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [region, setRegion] = React.useState("");
  const [crop, setCrop] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [errorText, setErrorText] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!message.trim()) {
      setErrorText("문의 내용을 입력해 주세요.");
      return;
    }

    setLoading(true);
    setErrorText("");

    try {
      const session_id = getOrCreateSessionId();

      const res = await fetch("/api/expo/inquiry", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          booth_id,
          booth_name,
          product_id,
          product_name,
          session_id,
          name: name.trim() || null,
          phone: phone.trim() || null,
          region: region.trim() || null,
          crop: crop.trim() || null,
          message: message.trim(),
          contact_channel: "form",
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "문의 저장에 실패했습니다.");
      }

      await sendExpoLog({
        event_type: "inquiry_submit",
        target_type: "inquiry",
        target_id: String(json.inquiry?.id ?? `${booth_id}_${Date.now()}`),
        booth_id,
        product_id,
        session_id,
        meta: {
          booth_name,
          product_name,
          has_name: Boolean(name.trim()),
          has_phone: Boolean(phone.trim()),
          region: region.trim() || null,
          crop: crop.trim() || null,
        },
      });

      setDone(true);
      setName("");
      setPhone("");
      setRegion("");
      setCrop("");
      setMessage("");
    } catch (e: any) {
      setErrorText(e?.message || "문의 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div style={S.doneBox}>
        문의가 접수되었습니다. 업체에서 확인 후 연락드릴 수 있습니다.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={S.form}>
      <div style={S.title}>상담/구매 문의</div>
      <div style={S.desc}>
        궁금한 점을 남기시면 업체가 확인할 수 있습니다.
      </div>

      <div style={S.grid2}>
        <div>
          <label style={S.label}>이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름"
            style={S.input}
          />
        </div>

        <div>
          <label style={S.label}>연락처</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-1234-5678"
            style={S.input}
          />
        </div>
      </div>

      <div style={S.grid2}>
        <div>
          <label style={S.label}>지역(시/군)</label>
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="예: 홍성군"
            style={S.input}
          />
        </div>

        <div>
          <label style={S.label}>재배작물</label>
          <input
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
            placeholder="예: 마늘, 고추, 딸기"
            style={S.input}
          />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={S.label}>문의 내용</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="예: 가격, 사용법, 구매 가능 여부를 알고 싶습니다."
          style={S.textarea}
        />
      </div>

      {errorText ? <div style={S.errorBox}>{errorText}</div> : null}

      <button type="submit" disabled={loading} style={S.submitBtn}>
        {loading ? "접수 중..." : "문의 보내기"}
      </button>
    </form>
  );
}

const S: Record<string, React.CSSProperties> = {
  form: {
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 18,
    background: "#fff",
    boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
  },
  title: {
    fontSize: 20,
    fontWeight: 950,
    color: "#111827",
  },
  desc: {
    marginTop: 8,
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 1.7,
  },
  grid2: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 900,
    marginBottom: 8,
    color: "#374151",
  },
  input: {
    width: "100%",
    height: 44,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    padding: "0 12px",
    fontSize: 14,
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    minHeight: 120,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    padding: 12,
    fontSize: 14,
    lineHeight: 1.6,
    boxSizing: "border-box",
    resize: "vertical",
  },
  submitBtn: {
    marginTop: 14,
    width: "100%",
    height: 48,
    borderRadius: 14,
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    fontWeight: 950,
    fontSize: 15,
    cursor: "pointer",
  },
  errorBox: {
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: 14,
    lineHeight: 1.6,
  },
  doneBox: {
    borderRadius: 16,
    padding: 16,
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontWeight: 800,
    lineHeight: 1.8,
  },
};