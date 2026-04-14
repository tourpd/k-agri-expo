"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default function BuyerLoginPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMsg(`로그인 실패: ${error.message}`);
        return;
      }

      router.replace("/buyer");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setMsg(`오류: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={S.page}>
      <div style={S.card}>
        <div style={S.kicker}>BUYER LOGIN</div>
        <h1 style={S.title}>바이어 로그인</h1>

        <p style={S.desc}>이메일과 비밀번호로 로그인합니다.</p>

        <form onSubmit={onSubmit} style={S.form}>
          <label style={S.label}>이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="buyer@company.com"
            style={S.input}
            autoComplete="email"
            required
          />

          <label style={{ ...S.label, marginTop: 12 }}>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 입력"
            style={S.input}
            autoComplete="current-password"
            required
          />

          <button type="submit" style={S.primaryBtn} disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {msg ? <div style={S.msg}>{msg}</div> : null}

        <div style={S.bottomRow}>
          <Link href="/buyer/signup" style={S.secondaryBtn}>
            바이어 회원가입
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
    background: "linear-gradient(135deg, #ffedd5 0%, #fff7ed 100%)",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    background: "#fff",
    borderRadius: 28,
    padding: 28,
    boxShadow: "0 24px 70px rgba(15,23,42,0.12)",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#ea580c",
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
    marginTop: 16,
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
    background: "#fef2f2",
    color: "#b91c1c",
    lineHeight: 1.7,
    whiteSpace: "pre-wrap" as const,
  },
  bottomRow: {
    marginTop: 18,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap" as const,
    alignItems: "center",
  },
  back: {
    color: "#111",
    textDecoration: "none",
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
  },
} satisfies Record<string, React.CSSProperties>;