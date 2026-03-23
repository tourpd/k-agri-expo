"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      alert("이메일을 입력해 주세요.");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/expo/admin`;

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        setMsg(`로그인 메일 발송 실패: ${error.message}`);
        return;
      }

      setMsg("로그인 메일을 발송했습니다. 가장 최근 메일의 링크를 같은 브라우저에서 바로 열어 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.box}>
          <div style={S.kicker}>ADMIN</div>
          <h1 style={S.title}>관리자 로그인</h1>
          <p style={S.desc}>
            관리자 화면은 별도 주소로만 접근합니다.
            로그인 메일을 받은 뒤 <strong>가장 최근 메일 링크</strong>를
            <strong> 같은 브라우저</strong>에서 열어 주십시오.
          </p>

          <form onSubmit={handleLogin} style={S.form}>
            <label style={S.label}>관리자 이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="예: tourpd@naver.com"
              style={S.input}
            />

            <button type="submit" disabled={loading} style={S.button}>
              {loading ? "발송 중..." : "로그인 메일 받기"}
            </button>
          </form>

          {msg ? <div style={S.msg}>{msg}</div> : null}

          <div style={S.helpBox}>
            <div style={S.helpTitle}>관리자 로그인이 안 되는 가장 흔한 이유</div>
            <ul style={S.helpList}>
              <li>예전 메일 링크를 눌렀을 때</li>
              <li>메일 링크가 만료됐을 때</li>
              <li>로그인 요청한 브라우저와 다른 브라우저에서 링크를 열었을 때</li>
              <li>Supabase Redirect URL 설정에 localhost 주소가 빠졌을 때</li>
            </ul>
          </div>

          <div style={S.bottomLinks}>
            <Link href="/login" style={S.backLink}>
              일반 입장 화면으로
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
    padding: "32px 18px 60px",
    color: "#0f172a",
  },
  wrap: {
    maxWidth: 760,
    margin: "0 auto",
  },
  box: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 28,
    padding: 30,
    boxShadow: "0 18px 40px rgba(15,23,42,0.06)",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
    letterSpacing: 0.4,
  },
  title: {
    margin: "10px 0 0",
    fontSize: 40,
    fontWeight: 950,
    letterSpacing: -0.8,
  },
  desc: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 1.9,
    color: "#64748b",
  },
  form: {
    marginTop: 22,
  },
  label: {
    display: "block",
    marginBottom: 8,
    fontSize: 13,
    fontWeight: 900,
    color: "#334155",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid #dbe2ea",
    boxSizing: "border-box",
    fontSize: 15,
  },
  button: {
    marginTop: 14,
    width: "100%",
    padding: "15px 16px",
    borderRadius: 16,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
    fontSize: 16,
  },
  msg: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    lineHeight: 1.8,
    color: "#334155",
    fontSize: 14,
  },
  helpBox: {
    marginTop: 22,
    borderRadius: 20,
    padding: 18,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 950,
  },
  helpList: {
    marginTop: 10,
    paddingLeft: 18,
    color: "#64748b",
    lineHeight: 1.9,
    fontSize: 14,
  },
  bottomLinks: {
    marginTop: 18,
  },
  backLink: {
    textDecoration: "none",
    color: "#0f172a",
    fontWeight: 900,
  },
};