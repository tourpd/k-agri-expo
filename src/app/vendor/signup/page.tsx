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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      if (!companyName.trim()) {
        setMsg("회사명을 입력해 주세요.");
        return;
      }

      if (!email.trim()) {
        setMsg("이메일을 입력해 주세요.");
        return;
      }

      if (!password.trim()) {
        setMsg("비밀번호를 입력해 주세요.");
        return;
      }

      if (password.length < 6) {
        setMsg("비밀번호는 6자 이상으로 입력해 주세요.");
        return;
      }

      if (password !== passwordConfirm) {
        setMsg("비밀번호 확인이 일치하지 않습니다.");
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            company_name: companyName.trim(),
            user_type: "vendor",
          },
        },
      });

      if (signUpError) {
        setMsg(`회원가입 실패: ${signUpError.message}`);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setMsg(`가입 후 로그인 실패: ${signInError.message}`);
        return;
      }

      router.replace("/vendor/apply");
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
        <div style={S.kicker}>VENDOR SIGNUP</div>
        <h1 style={S.title}>업체 회원가입</h1>
        <p style={S.desc}>
          회사명, 이메일, 비밀번호로 업체 계정을 만듭니다.
          <br />
          가입 후 바로 입점 신청 페이지로 이동합니다.
        </p>

        <form onSubmit={onSubmit} style={S.form}>
          <label style={S.label}>회사명</label>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="예: 도프"
            style={S.input}
            required
          />

          <label style={{ ...S.label, marginTop: 14 }}>이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vendor@company.com"
            style={S.input}
            required
          />

          <label style={{ ...S.label, marginTop: 14 }}>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 입력"
            style={S.input}
            required
          />

          <label style={{ ...S.label, marginTop: 14 }}>비밀번호 확인</label>
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="비밀번호 다시 입력"
            style={S.input}
            required
          />

          <button type="submit" style={S.primaryBtn} disabled={loading}>
            {loading ? "가입 중..." : "회원가입"}
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

const S = {
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
    maxWidth: 560,
    background: "#fff",
    borderRadius: 28,
    padding: 28,
    boxShadow: "0 24px 70px rgba(15,23,42,0.12)",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#2563eb",
  },
  title: {
    margin: "10px 0 0",
    fontSize: 34,
    fontWeight: 950,
  },
  desc: {
    marginTop: 12,
    color: "#64748b",
    lineHeight: 1.7,
  },
  form: {
    marginTop: 20,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 900,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #dbe2ea",
    boxSizing: "border-box",
    fontSize: 15,
  },
  primaryBtn: {
    width: "100%",
    marginTop: 18,
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
  },
  secondaryBtn: {
    display: "inline-block",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #ddd",
    background: "#fff",
    color: "#111",
    textDecoration: "none",
    fontWeight: 900,
  },
  msg: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    background: "#f8fafc",
    color: "#334155",
    lineHeight: 1.7,
  },
  bottomRow: {
    marginTop: 18,
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
} satisfies Record<string, React.CSSProperties>;