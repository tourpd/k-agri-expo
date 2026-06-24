// src/app/admin/crm/inbox/new/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import type { CSSProperties } from "react";

type Channel =
  | "phone"
  | "email"
  | "homepage"
  | "vendor_apply"
  | "buyer"
  | "manual"
  | "etc";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

export default function CrmInboxNewPage() {
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState<Channel>("phone");

  const [contactName, setContactName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function saveLead() {
    if (!safe(title) && !safe(content)) {
      alert("문의 제목 또는 내용을 입력하세요.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/admin/crm-inbox", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel,
          contact_name: contactName,
          company_name: companyName,
          phone,
          email,
          title,
          content,
          use_ai: true,
        }),
      });

      const data = await res.json();

      if (!data?.success) {
        alert(data?.error || "AI CRM 등록 실패");
        return;
      }

      location.href = `/admin/crm/inbox/${data.row.id}`;
    } catch {
      alert("AI CRM 등록 중 네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={S.page}>
      <section style={S.header}>
        <div>
          <div style={S.kicker}>K-AGRI AI CRM</div>
          <h1 style={S.title}>AI CRM 수동등록</h1>
          <p style={S.desc}>
            전화 메모, 바이어 메일, 입점 문의, OEM 문의를 붙여 넣으면 AI가 자동 분류합니다.
          </p>
        </div>

        <div style={S.headerLinks}>
          <Link href="/admin/crm/inbox" style={S.darkLink}>
            통합수신함
          </Link>
          <Link href="/admin/farmer-crm/inbox" style={S.blueLink}>
            고객 상담수신함
          </Link>
        </div>
      </section>

      <section style={S.card}>
        <div style={S.grid}>
          <div>
            <label style={S.label}>문의 채널</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as Channel)}
              style={S.input}
            >
              <option value="phone">전화</option>
              <option value="email">이메일</option>
              <option value="homepage">홈페이지 문의</option>
              <option value="vendor_apply">입점 신청</option>
              <option value="buyer">바이어 문의</option>
              <option value="manual">수동 입력</option>
              <option value="etc">기타</option>
            </select>
          </div>

          <Field label="이름" value={contactName} setValue={setContactName} />
          <Field label="회사명" value={companyName} setValue={setCompanyName} />
          <Field label="전화번호" value={phone} setValue={setPhone} />
          <Field label="이메일" value={email} setValue={setEmail} />
          <Field label="문의 제목" value={title} setValue={setTitle} />
        </div>

        <div style={S.full}>
          <label style={S.label}>문의 내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`예)
인도 바이어가 홍산마늘 100톤 수입 가능 여부를 문의했습니다.
가격, 선적 가능 시기, 인증서, MOQ를 알고 싶다고 합니다.`}
            style={S.textarea}
          />
        </div>

        <button
          type="button"
          onClick={saveLead}
          disabled={loading}
          style={{
            ...S.saveBtn,
            opacity: loading ? 0.65 : 1,
          }}
        >
          {loading ? "AI 분석 및 저장 중..." : "AI CRM 등록"}
        </button>
      </section>

      <section style={S.guideBox}>
        <b>AI가 자동 판단하는 항목</b>
        <p>
          문의유형, 사업영역, 우선순위, 예상 거래액, 담당자, AI 요약, 다음 행동을 자동 생성합니다.
        </p>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  setValue,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
}) {
  return (
    <div>
      <label style={S.label}>{label}</label>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={S.input}
      />
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: 16,
    color: "#111827",
  },
  header: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    padding: 22,
    marginBottom: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#7c3aed",
  },
  title: {
    margin: "6px 0 0",
    fontSize: 34,
    fontWeight: 950,
  },
  desc: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: 800,
    color: "#4b5563",
  },
  headerLinks: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  darkLink: link("#111827"),
  blueLink: link("#2563eb"),
  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    display: "grid",
    gap: 14,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2,minmax(0,1fr))",
    gap: 12,
  },
  full: {
    display: "grid",
    gap: 6,
  },
  label: {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 950,
    color: "#374151",
  },
  input: {
    width: "100%",
    height: 46,
    borderRadius: 14,
    border: "1px solid #d1d5db",
    padding: "0 12px",
    fontSize: 15,
    fontWeight: 850,
    boxSizing: "border-box",
    background: "#ffffff",
  },
  textarea: {
    width: "100%",
    minHeight: 260,
    borderRadius: 16,
    border: "1px solid #d1d5db",
    padding: 14,
    fontSize: 15,
    fontWeight: 800,
    lineHeight: 1.7,
    resize: "vertical",
    boxSizing: "border-box",
  },
  saveBtn: {
    minHeight: 52,
    borderRadius: 16,
    border: "none",
    background: "#7c3aed",
    color: "#ffffff",
    padding: "0 18px",
    fontSize: 16,
    fontWeight: 950,
    cursor: "pointer",
  },
  guideBox: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
    fontSize: 15,
    fontWeight: 850,
  },
};

function link(bg: string): CSSProperties {
  return {
    minHeight: 42,
    borderRadius: 12,
    background: bg,
    color: "#ffffff",
    padding: "0 14px",
    display: "inline-flex",
    alignItems: "center",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 950,
  };
}