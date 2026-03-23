"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");

    if (!username.trim()) {
      setErrorText("관리자 아이디를 입력해 주세요.");
      return;
    }

    if (!password.trim()) {
      setErrorText("비밀번호를 입력해 주세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorText(data.error || "로그인에 실패했습니다.");
        return;
      }

      window.location.href = "/admin/event";
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={S.page}>
      <div style={S.card}>
        <div style={S.eyebrow}>ADMIN</div>
        <h1 style={S.title}>관리자 로그인</h1>
        <p style={S.desc}>
          운영자 전용 화면입니다. 관리자 아이디와 비밀번호를 입력해 주세요.
        </p>

        <form onSubmit={onSubmit} style={S.form}>
          <div>
            <label style={S.label}>관리자 아이디</label>
            <input
              style={S.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="예: admin"
            />
          </div>

          <div>
            <label style={S.label}>비밀번호</label>
            <input
              type="password"
              style={S.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
            />
          </div>

          {errorText ? <div style={S.error}>{errorText}</div> : null}

          <button type="submit" style={S.submitBtn} disabled={loading}>
            {loading ? "로그인 중..." : "관리자 로그인"}
          </button>
        </form>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f5f6f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 760,
    borderRadius: 32,
    background: "#fff",
    border: "1px solid #e5e7eb",
    padding: 40,
    boxShadow: "0 20px 50px rgba(15,23,42,0.08)",
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: 950,
    color: "#16a34a",
    letterSpacing: 0.4,
  },
  title: {
    margin: "12px 0 0",
    fontSize: 56,
    lineHeight: 1.05,
    fontWeight: 950,
    color: "#0f172a",
  },
  desc: {
    marginTop: 24,
    fontSize: 18,
    lineHeight: 1.9,
    color: "#64748b",
  },
  form: {
    marginTop: 28,
    display: "grid",
    gap: 18,
  },
  label: {
    display: "block",
    marginBottom: 10,
    fontSize: 14,
    fontWeight: 900,
    color: "#334155",
  },
  input: {
    width: "100%",
    padding: "18px 18px",
    borderRadius: 18,
    border: "1px solid #dbe2ea",
    boxSizing: "border-box",
    fontSize: 18,
  },
  submitBtn: {
    marginTop: 8,
    width: "100%",
    padding: "18px 18px",
    borderRadius: 18,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontSize: 22,
    fontWeight: 950,
    cursor: "pointer",
  },
  error: {
    borderRadius: 16,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    padding: 14,
    fontWeight: 800,
    lineHeight: 1.7,
  },
};