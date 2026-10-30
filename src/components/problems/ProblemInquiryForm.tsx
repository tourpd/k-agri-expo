"use client";

import React, { useState } from "react";

/**
 * 문제 페이지 문의 양식 — 이름·전화·지역·내용 네 칸.
 * 농민은 가입하지 않습니다. 전화번호 한 번이면 됩니다.
 */
export default function ProblemInquiryForm({
  problemSlug,
  problemTitle,
  productName,
  boothId,
  needsCrop,
  compact,
}: {
  problemSlug: string;
  problemTitle: string;
  productName?: string | null;
  boothId?: string | null;
  needsCrop?: boolean;
  compact?: boolean;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [crop, setCrop] = useState("");
  const [message, setMessage] = useState("");
  const [agree, setAgree] = useState(true);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [notice, setNotice] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setNotice("");
    try {
      const res = await fetch("/api/expo/problem-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_slug: problemSlug,
          farmer_name: name,
          phone,
          region,
          crop,
          message,
          product_name: productName ?? "",
          booth_id: boothId ?? "",
          agree_privacy: agree,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        setState("error");
        setNotice(json?.error || "문의 접수에 실패했습니다. 전화로 문의해 주세요.");
        return;
      }
      setState("done");
      setNotice(json?.notice || "문의가 접수되었습니다.");
    } catch {
      setState("error");
      setNotice("연결이 끊겼습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  if (state === "done") {
    return (
      <div style={S.done}>
        <div style={S.doneTitle}>접수됐습니다</div>
        <div style={S.doneText}>{notice}</div>
        <div style={S.doneText}>급하시면 010-8216-1253 으로 전화 주셔도 됩니다.</div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={compact ? S.formCompact : S.form}>
      {!compact ? (
        <div style={S.head}>
          <div style={S.title}>기업에 묻기</div>
          <div style={S.sub}>
            {productName ? `관심 제품: ${productName}` : `${problemTitle} 관련 문의`} · 이름과 연락처만 있으면 됩니다
          </div>
        </div>
      ) : null}

      <div style={S.row}>
        <input style={S.input} placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} required />
        <input
          style={S.input}
          placeholder="전화번호"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>
      <div style={S.row}>
        <input style={S.input} placeholder="지역 (예: 충남 논산)" value={region} onChange={(e) => setRegion(e.target.value)} />
        {needsCrop ? (
          <input style={S.input} placeholder="작물" value={crop} onChange={(e) => setCrop(e.target.value)} />
        ) : null}
      </div>
      <textarea
        style={S.textarea}
        placeholder="면적, 증상이 시작된 시기, 궁금한 점을 적어 주세요 (안 적어도 됩니다)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
      />
      <label style={S.agree}>
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> 상담을 위해 이름·연락처를
        해당 기업에 전달하는 데 동의합니다
      </label>
      {state === "error" ? <div style={S.error}>{notice}</div> : null}
      <button type="submit" style={S.button} disabled={state === "sending"}>
        {state === "sending" ? "보내는 중…" : "문의 보내기"}
      </button>
    </form>
  );
}

const S: Record<string, React.CSSProperties> = {
  form: { display: "grid", gap: 10, padding: 16, borderRadius: 18, background: "#f0fdf4", border: "1px solid #bbf7d0" },
  formCompact: { display: "grid", gap: 8 },
  head: { marginBottom: 4 },
  title: { fontSize: 18, fontWeight: 950, color: "#14532d" },
  sub: { marginTop: 4, fontSize: 13, color: "#166534" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  input: { padding: "12px 12px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 15, minWidth: 0, background: "#fff" },
  textarea: { padding: "12px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 15, resize: "vertical", background: "#fff" },
  agree: { fontSize: 12, color: "#475569", lineHeight: 1.5 },
  error: { fontSize: 13, color: "#b91c1c", fontWeight: 700 },
  button: {
    padding: "14px",
    borderRadius: 14,
    border: 0,
    background: "#15803d",
    color: "#fff",
    fontSize: 16,
    fontWeight: 900,
    cursor: "pointer",
  },
  done: { padding: 18, borderRadius: 18, background: "#ecfdf5", border: "1px solid #a7f3d0" },
  doneTitle: { fontSize: 18, fontWeight: 950, color: "#065f46" },
  doneText: { marginTop: 6, fontSize: 14, color: "#047857" },
};
