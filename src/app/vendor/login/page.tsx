"use client";

import React, { useState } from "react";

type LoginResponse = {
  success?: boolean;
  error?: string;
  redirectTo?: string;
};

export default function VendorLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("이메일을 입력해 주세요.");
      setLoading(false);
      return;
    }

    if (!normalizedEmail.includes("@")) {
      setError("올바른 이메일 형식으로 입력해 주세요.");
      setLoading(false);
      return;
    }

    if (!password) {
      setError("비밀번호를 입력해 주세요.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/vendor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const json = (await res.json().catch(() => null)) as LoginResponse | null;

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "로그인에 실패했습니다.");
      }

      window.location.replace(json.redirectTo || "/vendor/orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인 중 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  const canInteract = !loading;

  return (
    <main style={S.page}>
      <section style={S.card}>
        <p style={S.eyebrow}>VENDOR LOGIN</p>

        <h1 style={S.title}>업체 로그인</h1>

        <p style={S.desc}>
          업체 이메일과 비밀번호로 로그인합니다.
          <br />
          로그인 후 부스, 특가, 자료를 관리할 수 있습니다.
        </p>

        <form onSubmit={handleLogin} style={S.form} autoComplete="off" noValidate>
          <input
            type="text"
            name="vendor-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="업체 이메일 입력"
            spellCheck={false}
            disabled={!canInteract}
            style={S.input}
          />

          <div style={S.passwordWrap}>
            <input
              type={showPassword ? "text" : "password"}
              name="vendor-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              spellCheck={false}
              disabled={!canInteract}
              style={S.passwordInput}
            />

            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={!canInteract}
              style={S.showBtn}
            >
              {showPassword ? "숨기기" : "보기"}
            </button>
          </div>

          {error ? <div style={S.error}>{error}</div> : null}

          <button type="submit" disabled={!canInteract} style={S.loginBtn}>
            {loading ? "로그인 중..." : "로그인"}
          </button>

          <div style={S.bottomRow}>
            <a href="/vendor/signup" style={S.joinBtn}>
              업체 회원가입
            </a>

            <a href="/login" style={S.backLink}>
              ← 로그인 선택으로
            </a>
          </div>
        </form>
      </section>
    </main>
  );
}

const inputBase: React.CSSProperties = {
  width: "100%",
  height: 64,
  borderRadius: 18,
  border: "2px solid #d1d5db",
  background: "#ffffff",
  padding: "0 22px",
  fontSize: 20,
  fontWeight: 900,
  color: "#111827",
  boxSizing: "border-box",
  outline: "none",
};

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#dbeafe",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 760,
    background: "#ffffff",
    borderRadius: 32,
    padding: 44,
    boxShadow: "0 18px 40px rgba(15,23,42,0.06)",
  },
  eyebrow: {
    margin: 0,
    fontSize: 14,
    fontWeight: 950,
    color: "#2563eb",
  },
  title: {
    margin: "12px 0 0",
    fontSize: 44,
    fontWeight: 950,
    color: "#111827",
  },
  desc: {
    marginTop: 44,
    fontSize: 24,
    lineHeight: 1.7,
    fontWeight: 800,
    color: "#64748b",
  },
  form: {
    marginTop: 40,
  },
  input: {
    ...inputBase,
  },
  passwordWrap: {
    marginTop: 28,
    display: "flex",
    gap: 10,
  },
  passwordInput: {
    ...inputBase,
    flex: 1,
  },
  showBtn: {
    width: 90,
    borderRadius: 18,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    fontSize: 15,
    fontWeight: 950,
    cursor: "pointer",
  },
  error: {
    marginTop: 16,
    padding: "14px 16px",
    borderRadius: 14,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontSize: 15,
    fontWeight: 900,
  },
  loginBtn: {
    marginTop: 28,
    width: "100%",
    height: 64,
    border: "none",
    borderRadius: 18,
    background: "#111111",
    color: "#ffffff",
    fontSize: 24,
    fontWeight: 950,
    cursor: "pointer",
  },
  bottomRow: {
    marginTop: 26,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  joinBtn: {
    padding: "16px 22px",
    borderRadius: 18,
    border: "1px solid #d1d5db",
    color: "#111111",
    background: "#ffffff",
    fontSize: 20,
    fontWeight: 950,
    textDecoration: "none",
  },
  backLink: {
    color: "#111111",
    fontSize: 20,
    fontWeight: 950,
    textDecoration: "none",
  },
};