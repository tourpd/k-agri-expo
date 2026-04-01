"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function BuyerSignupPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const cleanEmail = email.trim();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (error) {
        setMsg(`회원가입 실패: ${error.message}`);
        return;
      }

      const needsEmailConfirm = !data?.session && !!data?.user;

      if (needsEmailConfirm) {
        setSignedUp(true);
        setMsg(
          `회원가입이 완료되었습니다. ${cleanEmail} 로 인증 메일을 보냈습니다. 메일 인증 후 바이어 로그인으로 들어가 주세요.`
        );
        return;
      }

      const res = await fetch("/api/buyer/bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_name: companyName.trim(),
          contact_name: contactName.trim(),
          email: cleanEmail,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        setMsg(`바이어 계정 초기화 실패: ${json?.error ?? "unknown"}`);
        return;
      }

      router.replace("/buyer");
      router.refresh();
    } catch (err: any) {
      setMsg(`오류: ${err?.message ?? "unknown"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={S.page}>
      <div style={S.card}>
        <div style={S.kicker}>BUYER SIGNUP</div>
        <h1 style={S.title}>바이어 회원가입</h1>
        <p style={S.desc}>
          엑스포에서 제품 문의, 업체 연결, 상담 접수를 하실 바이어 계정을 만듭니다.
        </p>
        <p style={S.guide}>
          이메일은 로그인 아이디로 사용됩니다. 비밀번호는 직접 정하시면 됩니다.
        </p>

        <form onSubmit={onSubmit} style={S.form}>
          <label style={S.label}>회사명</label>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="예: 대도에그테크"
            style={S.input}
            required
            disabled={signedUp}
          />

          <label style={S.labelBlock}>담당자명</label>
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="예: 이혁"
            style={S.input}
            required
            disabled={signedUp}
          />

          <label style={S.labelBlock}>이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="예: buyer@company.com"
            style={S.input}
            required
            disabled={signedUp}
          />

          <label style={S.labelBlock}>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="직접 정한 비밀번호 입력"
            style={S.input}
            required
            disabled={signedUp}
          />

          {!signedUp ? (
            <button type="submit" style={S.primaryBtn} disabled={loading}>
              {loading ? "가입 중..." : "회원가입"}
            </button>
          ) : (
            <Link href="/login/buyer" style={S.primaryBtnLink}>
              바이어 로그인으로 이동
            </Link>
          )}
        </form>

        {msg ? <div style={S.msg}>{msg}</div> : null}

        <div style={S.bottomRow}>
          <Link href="/login/buyer" style={S.secondaryBtn}>
            바이어 로그인
          </Link>

          <Link href="/login" style={S.back}>
            ← 로그인 선택으로
          </Link>
        </div>
      </div>
    </main>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 760,
    background: "#fff",
    borderRadius: 28,
    padding: 36,
    boxShadow: "0 24px 70px rgba(15,23,42,0.12)",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#d97706",
  },
  title: {
    margin: "10px 0 0",
    fontSize: 44,
    fontWeight: 950,
  },
  desc: {
    marginTop: 16,
    color: "#475569",
    lineHeight: 1.7,
    fontSize: 18,
  },
  guide: {
    marginTop: 8,
    color: "#64748b",
    lineHeight: 1.7,
    fontSize: 15,
  },
  form: {
    marginTop: 24,
  },
  label: {
    display: "block",
    fontSize: 14,
    fontWeight: 900,
    marginBottom: 8,
  },
  labelBlock: {
    display: "block",
    fontSize: 14,
    fontWeight: 900,
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    padding: "16px 18px",
    borderRadius: 16,
    border: "1px solid #dbe2ea",
    boxSizing: "border-box" as const,
    fontSize: 16,
  },
  primaryBtn: {
    width: "100%",
    marginTop: 22,
    padding: "16px 18px",
    borderRadius: 16,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 950,
    fontSize: 18,
    cursor: "pointer",
  },
  primaryBtnLink: {
    display: "block",
    width: "100%",
    marginTop: 22,
    padding: "16px 18px",
    borderRadius: 16,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 950,
    fontSize: 18,
    textDecoration: "none",
    textAlign: "center" as const,
    boxSizing: "border-box" as const,
  },
  secondaryBtn: {
    display: "inline-block",
    padding: "12px 16px",
    borderRadius: 14,
    border: "1px solid #ddd",
    background: "#fff",
    color: "#111",
    textDecoration: "none",
    fontWeight: 900,
  },
  msg: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    background: "#f8fafc",
    color: "#334155",
    lineHeight: 1.7,
    fontSize: 15,
  },
  bottomRow: {
    marginTop: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap" as const,
  },
  back: {
    color: "#111",
    textDecoration: "none",
    fontWeight: 900,
  },
} satisfies Record<string, React.CSSProperties>;