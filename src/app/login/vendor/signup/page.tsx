"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default function VendorSignupPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const cleanEmail = email.trim();

      if (!companyName.trim()) {
        setMsg("회사명을 입력해 주세요.");
        return;
      }

      if (!cleanEmail) {
        setMsg("이메일을 입력해 주세요.");
        return;
      }

      if (password.length < 6) {
        setMsg("비밀번호는 6자 이상으로 입력해 주세요.");
        return;
      }

      if (password !== passwordConfirm) {
        setMsg("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        return;
      }

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
        setMsg(
          `회원가입이 완료되었습니다. ${cleanEmail} 로 인증 메일을 보냈습니다. 인증 후 로그인해 주세요.`
        );
        return;
      }

      const res = await fetch("/api/vendor/bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_name: companyName.trim(),
          contact_name: contactName.trim() || companyName.trim(),
          email: cleanEmail,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        setMsg(`참가기업 계정 초기화 실패: ${json?.error ?? "unknown"}`);
        return;
      }

      router.replace("/vendor");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "unknown";
      setMsg(`오류: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={S.page}>
      <div style={S.card}>
        <div style={S.kicker}>VENDOR SIGNUP</div>
        <h1 style={S.title}>업체 회원가입</h1>
        <p style={S.desc}>회사명, 이메일, 비밀번호로 업체 계정을 만듭니다.</p>

        <form onSubmit={onSubmit} style={S.form}>
          <label style={S.label}>회사명</label>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="예: 고든산업"
            style={S.input}
            required
          />

          <label style={S.labelBlock}>담당자명</label>
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="예: 홍길동"
            style={S.input}
          />

          <label style={S.labelBlock}>이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="예: vendor@company.com"
            style={S.input}
            required
          />

          <label style={S.labelBlock}>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 입력"
            style={S.input}
            required
          />

          <label style={S.labelBlock}>비밀번호 확인</label>
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="비밀번호 다시 입력"
            style={S.input}
            required
          />

          <button type="submit" style={S.primaryBtn} disabled={loading}>
            {loading ? "회원가입 중..." : "회원가입"}
          </button>
        </form>

        {msg ? <div style={S.msg}>{msg}</div> : null}

        <div style={S.bottomRow}>
          <Link href="/login/vendor" style={S.secondaryBtn}>
            업체 로그인
          </Link>

          <Link href="/login" style={S.back}>
            ← 로그인 선택으로
          </Link>
        </div>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)",
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
    color: "#2563eb",
  },
  title: {
    margin: "10px 0 0",
    fontSize: 44,
    fontWeight: 950,
    color: "#111827",
  },
  desc: {
    marginTop: 16,
    color: "#475569",
    lineHeight: 1.7,
    fontSize: 18,
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
    boxSizing: "border-box",
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
    flexWrap: "wrap",
  },
  back: {
    color: "#111",
    textDecoration: "none",
    fontWeight: 900,
  },
};