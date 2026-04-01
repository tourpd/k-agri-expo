"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function VendorApplyPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    companyName: "",
    ownerName: "",
    email: "",
    phone: "",
    bizNo: "",
    categoryPrimary: "",
    intro: "",
    websiteUrl: "",
    youtubeUrl: "",
    documentUrl: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      if (!form.companyName.trim()) throw new Error("회사명을 입력해 주세요.");
      if (!form.ownerName.trim()) throw new Error("대표자명을 입력해 주세요.");
      if (!form.email.trim()) throw new Error("이메일을 입력해 주세요.");
      if (!form.phone.trim()) throw new Error("연락처를 입력해 주세요.");
      if (!form.categoryPrimary.trim()) throw new Error("주 카테고리를 선택해 주세요.");
      if (!form.intro.trim()) throw new Error("회사 소개를 입력해 주세요.");

      const res = await fetch("/api/vendor/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "입점 신청에 실패했습니다.");
      }

      setMsg("입점 신청이 접수되었습니다. 관리자 승인 후 부스 운영이 가능합니다.");

      setTimeout(() => {
        router.replace("/expo/vendor/dashboard");
        router.refresh();
      }, 1000);
    } catch (error: any) {
      setMsg(error?.message || "입점 신청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.kicker}>VENDOR APPLY</div>
        <h1 style={S.title}>업체 입점 신청</h1>
        <p style={S.desc}>
          회사 정보와 기본 소개를 입력하면 관리자 검토 후 부스 운영이 열립니다.
        </p>

        <form onSubmit={onSubmit} style={S.form}>
          <div style={S.grid}>
            <label style={S.labelWrap}>
              <div style={S.label}>회사명</div>
              <input
                name="companyName"
                value={form.companyName}
                onChange={onChange}
                style={S.input}
                placeholder="예: 도프"
              />
            </label>

            <label style={S.labelWrap}>
              <div style={S.label}>대표자명</div>
              <input
                name="ownerName"
                value={form.ownerName}
                onChange={onChange}
                style={S.input}
                placeholder="예: 조세환"
              />
            </label>

            <label style={S.labelWrap}>
              <div style={S.label}>이메일</div>
              <input
                name="email"
                value={form.email}
                onChange={onChange}
                style={S.input}
                placeholder="vendor@company.com"
              />
            </label>

            <label style={S.labelWrap}>
              <div style={S.label}>연락처</div>
              <input
                name="phone"
                value={form.phone}
                onChange={onChange}
                style={S.input}
                placeholder="010-0000-0000"
              />
            </label>

            <label style={S.labelWrap}>
              <div style={S.label}>사업자등록번호</div>
              <input
                name="bizNo"
                value={form.bizNo}
                onChange={onChange}
                style={S.input}
                placeholder="123-45-67890"
              />
            </label>

            <label style={S.labelWrap}>
              <div style={S.label}>주 카테고리</div>
              <select
                name="categoryPrimary"
                value={form.categoryPrimary}
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
          </div>

          <label style={S.labelWrap}>
            <div style={S.label}>회사 소개</div>
            <textarea
              name="intro"
              value={form.intro}
              onChange={onChange}
              style={S.textarea}
              placeholder="주요 제품, 강점, 고객층, 엑스포에서 보여주고 싶은 내용을 적어주세요."
            />
          </label>

          <div style={S.grid}>
            <label style={S.labelWrap}>
              <div style={S.label}>홈페이지</div>
              <input
                name="websiteUrl"
                value={form.websiteUrl}
                onChange={onChange}
                style={S.input}
                placeholder="https://"
              />
            </label>

            <label style={S.labelWrap}>
              <div style={S.label}>유튜브 채널</div>
              <input
                name="youtubeUrl"
                value={form.youtubeUrl}
                onChange={onChange}
                style={S.input}
                placeholder="https://youtube.com/..."
              />
            </label>
          </div>

          <label style={S.labelWrap}>
            <div style={S.label}>소개서/카탈로그 링크</div>
            <input
              name="documentUrl"
              value={form.documentUrl}
              onChange={onChange}
              style={S.input}
              placeholder="https://drive.google.com/... 또는 PDF 링크"
            />
          </label>

          {msg ? <div style={S.msg}>{msg}</div> : null}

          <div style={S.actionRow}>
            <button type="submit" style={S.submitBtn} disabled={loading}>
              {loading ? "신청 중..." : "입점 신청 제출"}
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
    fontSize: 36,
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
    minHeight: 140,
    borderRadius: 14,
    border: "1px solid #dbe2ea",
    padding: 14,
    boxSizing: "border-box",
    fontSize: 15,
    resize: "vertical",
    background: "#fff",
    lineHeight: 1.7,
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