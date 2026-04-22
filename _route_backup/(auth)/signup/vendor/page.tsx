"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VendorSignupPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setLoading(true);
    setMsg("");

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setMsg(error.message);
        return;
      }

      // 🔥 바로 로그인
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError) {
        setMsg("가입은 되었지만 로그인 실패");
        return;
      }

      // 🔥 중요: 절대 apply로 보내지 마
      router.replace("/vendor");

    } catch (err: any) {
      setMsg(err?.message ?? "오류 발생");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={S.page}>
      <div style={S.card}>
        <div style={S.kicker}>VENDOR SIGNUP</div>
        <h1 style={S.title}>기업 회원가입</h1>

        <input
          placeholder="회사명"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          style={S.input}
        />

        <input
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={S.input}
        />

        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={S.input}
        />

        <button onClick={handleSignup} style={S.btn} disabled={loading}>
          {loading ? "가입 중..." : "회원가입"}
        </button>

        {msg && <div style={S.msg}>{msg}</div>}

        <Link href="/login/vendor">이미 계정 있음 → 로그인</Link>
      </div>
    </main>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f8fafc",
  },
  card: {
    width: 400,
    background: "#fff",
    padding: 30,
    borderRadius: 20,
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  kicker: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: 800,
  },
  title: {
    fontSize: 28,
    fontWeight: 900,
  },
  input: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #ddd",
  },
  btn: {
    padding: 14,
    background: "#111",
    color: "#fff",
    borderRadius: 10,
    border: "none",
    fontWeight: 900,
    cursor: "pointer",
  },
  msg: {
    marginTop: 10,
    color: "red",
  },
};