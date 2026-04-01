"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function FarmerLoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
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

      router.replace("/farmer");
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
        <div style={S.kicker}>FARMER LOGIN</div>
        <h1 style={S.title}>농민 로그인</h1>
        <p style={S.desc}>이미 가입한 농민 계정으로 로그인합니다.</p>

        <form onSubmit={onSubmit} style={S.form}>
          <label style={S.label}>이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="예: farmer@email.com"
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

          <button type="submit" style={S.primaryBtn} disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {msg ? <div style={S.msg}>{msg}</div> : null}

        <div style={S.bottomRow}>
          <Link href="/signup/farmer" style={S.secondaryBtn}>
            농민 회원가입
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
    background: "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 720,
    background: "#fff",
    borderRadius: 28,
    padding: 36,
    boxShadow: "0 24px 70px rgba(15,23,42,0.12)",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#15803d",
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