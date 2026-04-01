"use client";

import React, { useState } from "react";

type BoothEditorClientProps = {
  userId: string;
  vendor: any;
  booth: any;
};

export default function BoothEditorClient({
  userId,
  vendor,
  booth,
}: BoothEditorClientProps) {
  const [form, setForm] = useState({
    name: booth?.name || vendor?.company_name || "",
    category_primary: booth?.category_primary || "",
    region: booth?.region || "대한민국",
    contact_name: booth?.contact_name || "",
    phone: booth?.phone || "",
    email: booth?.email || vendor?.email || "",
    intro: booth?.intro || "",
    description: booth?.description || "",
    youtube_url: booth?.youtube_url || "",
    website_url: booth?.website_url || "",
    document_url: booth?.document_url || "",
    is_published: !!booth?.is_published,
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/vendor/booth/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          ...form,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "부스 저장에 실패했습니다.");
      }

      setMsg("부스 정보가 저장되었습니다.");
    } catch (error: any) {
      setMsg(error?.message || "저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.kicker}>BOOTH EDITOR</div>
        <h1 style={S.title}>부스 편집</h1>
        <p style={S.desc}>
          농민이 실제로 보게 되는 부스 소개, 연락처, 영상/링크 정보를 편집합니다.
        </p>

        <form onSubmit={onSubmit} style={S.form}>
          <div style={S.grid}>
            <label style={S.labelWrap}>
              <div style={S.label}>부스명</div>
              <input name="name" value={form.name} onChange={onChange} style={S.input} />
            </label>

            <label style={S.labelWrap}>
              <div style={S.label}>카테고리</div>
              <select
                name="category_primary"
                value={form.category_primary}
                onChange={onChange}
                style={S.input}
              >
                <option value="">선택하세요</option>
                <option value="비료">비료</option>
                <option value="영양제">영양제</option>
                <option value="농약">농약</option>
                <option value="친환경자재">친환경자재</option>
                <option value="농기계">농기계</option>
                <option value="종자">종자</option>
                <option value="스마트팜">스마트팜</option>
                <option value="농업미디어">농업미디어</option>
                <option value="미래식량·곤충산업">미래식량·곤충산업</option>
              </select>
            </label>

            <label style={S.labelWrap}>
              <div style={S.label}>지역</div>
              <input name="region" value={form.region} onChange={onChange} style={S.input} />
            </label>

            <label style={S.labelWrap}>
              <div style={S.label}>담당자명</div>
              <input
                name="contact_name"
                value={form.contact_name}
                onChange={onChange}
                style={S.input}
              />
            </label>

            <label style={S.labelWrap}>
              <div style={S.label}>연락처</div>
              <input name="phone" value={form.phone} onChange={onChange} style={S.input} />
            </label>

            <label style={S.labelWrap}>
              <div style={S.label}>이메일</div>
              <input name="email" value={form.email} onChange={onChange} style={S.input} />
            </label>
          </div>

          <label style={S.labelWrap}>
            <div style={S.label}>한 줄 소개</div>
            <input name="intro" value={form.intro} onChange={onChange} style={S.input} />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>상세 소개</div>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              style={S.textarea}
            />
          </label>

          <div style={S.grid}>
            <label style={S.labelWrap}>
              <div style={S.label}>유튜브 링크</div>
              <input
                name="youtube_url"
                value={form.youtube_url}
                onChange={onChange}
                style={S.input}
              />
            </label>

            <label style={S.labelWrap}>
              <div style={S.label}>홈페이지 링크</div>
              <input
                name="website_url"
                value={form.website_url}
                onChange={onChange}
                style={S.input}
              />
            </label>
          </div>

          <label style={S.labelWrap}>
            <div style={S.label}>카탈로그 / 문서 링크</div>
            <input
              name="document_url"
              value={form.document_url}
              onChange={onChange}
              style={S.input}
            />
          </label>

          <label style={S.checkRow}>
            <input
              type="checkbox"
              name="is_published"
              checked={form.is_published}
              onChange={onChange}
            />
            <span>부스 공개</span>
          </label>

          {msg ? <div style={S.msg}>{msg}</div> : null}

          <div style={S.actionRow}>
            <button type="submit" style={S.submitBtn} disabled={loading}>
              {loading ? "저장 중..." : "부스 저장"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: 24,
  },
  wrap: {
    maxWidth: 980,
    margin: "0 auto",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 28,
    padding: 28,
    boxShadow: "0 14px 34px rgba(15,23,42,0.05)",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#2563eb",
    letterSpacing: 0.4,
  },
  title: {
    margin: "10px 0 0",
    fontSize: 34,
    fontWeight: 950,
    color: "#0f172a",
  },
  desc: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 15,
    lineHeight: 1.8,
  },
  form: {
    marginTop: 24,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 16,
  },
  labelWrap: {
    display: "block",
    marginTop: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: 900,
    color: "#334155",
  },
  input: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    border: "1px solid #dbe2ea",
    padding: "0 14px",
    boxSizing: "border-box",
    fontSize: 15,
    background: "#fff",
  },
  textarea: {
    width: "100%",
    minHeight: 160,
    borderRadius: 14,
    border: "1px solid #dbe2ea",
    padding: 14,
    boxSizing: "border-box",
    fontSize: 15,
    resize: "vertical",
    background: "#fff",
    lineHeight: 1.7,
  },
  checkRow: {
    marginTop: 18,
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 800,
    color: "#0f172a",
  },
  msg: {
    marginTop: 18,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    padding: 14,
    color: "#334155",
    lineHeight: 1.7,
    fontWeight: 700,
  },
  actionRow: {
    marginTop: 22,
    display: "flex",
    justifyContent: "flex-end",
  },
  submitBtn: {
    border: "none",
    background: "#0f172a",
    color: "#fff",
    borderRadius: 14,
    padding: "14px 18px",
    fontSize: 15,
    fontWeight: 950,
    cursor: "pointer",
  },
};