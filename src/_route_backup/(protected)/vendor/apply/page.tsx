"use client";

import React, { useState } from "react";

export const dynamic = "force-dynamic";

const CATEGORY_OPTIONS = [
  { value: "", label: "선택하세요" },
  { value: "fertilizer", label: "비료/영양제" },
  { value: "pesticide", label: "병해충/자재" },
  { value: "machine", label: "농기계" },
  { value: "seed", label: "종자/묘" },
  { value: "smartfarm", label: "스마트농업" },
  { value: "etc", label: "기타" },
];

export default function VendorApplyPage() {
  const [companyName, setCompanyName] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [categoryPrimary, setCategoryPrimary] = useState("");
  const [companyIntro, setCompanyIntro] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [brochureUrl, setBrochureUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setOk(false);

    try {
      const res = await fetch("/api/vendor/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_name: companyName,
          representative_name: representativeName,
          email,
          phone,
          business_number: businessNumber,
          category_primary: categoryPrimary,
          company_intro: companyIntro,
          website_url: websiteUrl,
          youtube_url: youtubeUrl,
          brochure_url: brochureUrl,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        setMsg(json?.error ?? "입점 신청 중 오류가 발생했습니다.");
        setOk(false);
        return;
      }

      setMsg(json?.message ?? "입점 신청이 접수되었습니다.");
      setOk(true);
    } catch (err: any) {
      setMsg(err?.message ?? "입점 신청 중 오류가 발생했습니다.");
      setOk(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={S.page}>
      <div style={S.card}>
        <div style={S.kicker}>VENDOR APPLY</div>
        <h1 style={S.title}>업체 입점 신청</h1>
        <p style={S.desc}>
          회사 정보와 기본 소개를 입력하면 관리자 검토 후 부스 운영이 열립니다.
        </p>

        <form onSubmit={handleSubmit} style={S.form}>
          <div style={S.grid2}>
            <div>
              <label style={S.label}>회사명</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="예: 도프"
                style={S.input}
                required
              />
            </div>

            <div>
              <label style={S.label}>대표자명</label>
              <input
                value={representativeName}
                onChange={(e) => setRepresentativeName(e.target.value)}
                placeholder="예: 조세환"
                style={S.input}
              />
            </div>

            <div>
              <label style={S.label}>이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor@company.com"
                style={S.input}
                required
              />
            </div>

            <div>
              <label style={S.label}>연락처</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                style={S.input}
              />
            </div>

            <div>
              <label style={S.label}>사업자등록번호</label>
              <input
                value={businessNumber}
                onChange={(e) => setBusinessNumber(e.target.value)}
                placeholder="123-45-67890"
                style={S.input}
              />
            </div>

            <div>
              <label style={S.label}>주 카테고리</label>
              <select
                value={categoryPrimary}
                onChange={(e) => setCategoryPrimary(e.target.value)}
                style={S.input}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={S.block}>
            <label style={S.label}>회사 소개</label>
            <textarea
              value={companyIntro}
              onChange={(e) => setCompanyIntro(e.target.value)}
              placeholder="주요 제품, 강점, 고객층, 엑스포에서 보여주고 싶은 내용을 적어주세요."
              style={S.textarea}
            />
          </div>

          <div style={S.grid2}>
            <div>
              <label style={S.label}>홈페이지</label>
              <input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://"
                style={S.input}
              />
            </div>

            <div>
              <label style={S.label}>유튜브 채널</label>
              <input
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                style={S.input}
              />
            </div>
          </div>

          <div style={S.block}>
            <label style={S.label}>소개서/카탈로그 링크</label>
            <input
              value={brochureUrl}
              onChange={(e) => setBrochureUrl(e.target.value)}
              placeholder="https://drive.google.com/... 또는 PDF 링크"
              style={S.input}
            />
          </div>

          <div style={S.bottomRow}>
            <button type="submit" style={S.submitBtn} disabled={loading}>
              {loading ? "제출 중..." : "입점 신청 제출"}
            </button>
          </div>

          {msg ? (
            <div
              style={{
                ...S.msg,
                ...(ok ? S.msgOk : S.msgError),
              }}
            >
              {msg}
            </div>
          ) : null}
        </form>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f3f6fb",
    padding: "32px 16px 60px",
  },
  card: {
    maxWidth: 1080,
    margin: "0 auto",
    background: "#fff",
    borderRadius: 28,
    padding: 28,
    boxShadow: "0 16px 40px rgba(15,23,42,0.06)",
    border: "1px solid #e5e7eb",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#2563eb",
    letterSpacing: 0.4,
  },
  title: {
    margin: "10px 0 0",
    fontSize: 30,
    fontWeight: 950,
    color: "#0f172a",
  },
  desc: {
    marginTop: 12,
    fontSize: 15,
    color: "#64748b",
    lineHeight: 1.8,
  },
  form: {
    marginTop: 26,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  block: {
    marginTop: 16,
  },
  label: {
    display: "block",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 900,
    color: "#111827",
  },
  input: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    border: "1px solid #dbe2ea",
    padding: "0 16px",
    fontSize: 15,
    boxSizing: "border-box",
    background: "#fff",
  },
  textarea: {
    width: "100%",
    minHeight: 150,
    borderRadius: 16,
    border: "1px solid #dbe2ea",
    padding: 16,
    fontSize: 15,
    boxSizing: "border-box",
    resize: "vertical",
    background: "#fff",
    lineHeight: 1.7,
  },
  bottomRow: {
    marginTop: 20,
    display: "flex",
    justifyContent: "flex-end",
  },
  submitBtn: {
    border: "none",
    background: "#0f172a",
    color: "#fff",
    borderRadius: 16,
    padding: "16px 22px",
    fontWeight: 950,
    fontSize: 16,
    cursor: "pointer",
  },
  msg: {
    marginTop: 18,
    padding: "14px 16px",
    borderRadius: 14,
    fontSize: 14,
    lineHeight: 1.7,
    fontWeight: 700,
  },
  msgOk: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
  },
  msgError: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
  },
};