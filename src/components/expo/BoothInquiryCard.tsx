"use client";

import React, { useMemo, useState } from "react";

type BoothInquiryCardProps = {
  boothId: string;
  boothName: string;
  defaultContactName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
};

export default function BoothInquiryCard({
  boothId,
  boothName,
  defaultContactName = "",
  defaultEmail = "",
  defaultPhone = "",
}: BoothInquiryCardProps) {
  const [contactName, setContactName] = useState(defaultContactName);
  const [phone, setPhone] = useState(defaultPhone);
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState(
    `${boothName} 관련 상담을 요청드립니다.`
  );

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");

  const isDisabled = useMemo(() => {
    return loading || !message.trim();
  }, [loading, message]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice("");
    setErrorNotice("");

    try {
      const res = await fetch("/api/lead/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booth_id: boothId,
          contact_name: contactName,
          phone,
          email,
          message,
          source_type: "booth_inquiry",
        }),
      });

      const json = await res.json();

      if (!json?.ok) {
        throw new Error(json?.error || "상담 요청 저장에 실패했습니다.");
      }

      setNotice(
        "문의가 접수되었습니다. 관리자가 먼저 검토한 뒤 적합한 방식으로 연결해드립니다."
      );
    } catch (error) {
      setErrorNotice(
        error instanceof Error ? error.message : "상담 요청 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={S.wrap}>
      <div style={S.kicker}>BUYER INQUIRY</div>
      <h3 style={S.title}>국내 바이어 상담 요청</h3>
      <p style={S.desc}>
        문의 내용은 먼저 운영팀이 검토합니다. 자동으로 업체에 바로 전달되지 않으며,
        상담 목적과 조건을 확인한 뒤 적합한 업체를 선별해 연결합니다.
      </p>

      <div style={S.noticeBox}>
        <div style={S.noticeTitle}>통제형 상담 안내</div>
        <div style={S.noticeText}>
          1. 문의 접수
          <br />
          2. 관리자 검토
          <br />
          3. 필요 시 추가 확인
          <br />
          4. 적합 업체 선별 후 연결
        </div>
      </div>

      <form onSubmit={handleSubmit} style={S.form}>
        <label style={S.label}>담당자명</label>
        <input
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          style={S.input}
          placeholder="담당자명을 입력하세요"
        />

        <label style={{ ...S.label, marginTop: 12 }}>연락처</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={S.input}
          placeholder="연락처를 입력하세요"
        />

        <label style={{ ...S.label, marginTop: 12 }}>이메일</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={S.input}
          placeholder="이메일을 입력하세요"
        />

        <label style={{ ...S.label, marginTop: 12 }}>문의 내용</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={S.textarea}
          rows={6}
          placeholder="필요한 제품, 수량, 시기, 상담 목적 등을 입력하세요"
          required
        />

        <button type="submit" style={S.button} disabled={isDisabled}>
          {loading ? "접수 중..." : "상담 요청 보내기"}
        </button>
      </form>

      {notice ? <div style={S.success}>{notice}</div> : null}
      {errorNotice ? <div style={S.error}>{errorNotice}</div> : null}
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    marginTop: 24,
    padding: 24,
    borderRadius: 24,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    boxShadow: "0 12px 32px rgba(15,23,42,0.06)",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 900,
    color: "#2563eb",
  },
  title: {
    margin: "10px 0 0",
    fontSize: 28,
    fontWeight: 900,
    color: "#111827",
  },
  desc: {
    marginTop: 10,
    color: "#64748b",
    lineHeight: 1.7,
  },
  noticeBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    border: "1px solid #dbeafe",
    background: "#eff6ff",
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: "#1d4ed8",
  },
  noticeText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 1.8,
    color: "#1e3a8a",
  },
  form: {
    marginTop: 18,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 8,
    color: "#111827",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #dbe2ea",
    boxSizing: "border-box",
    fontSize: 15,
  },
  textarea: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #dbe2ea",
    boxSizing: "border-box",
    fontSize: 15,
    resize: "vertical",
  },
  button: {
    width: "100%",
    marginTop: 16,
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #111827",
    background: "#111827",
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
  },
  success: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    color: "#065f46",
    fontWeight: 700,
  },
  error: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontWeight: 700,
  },
};