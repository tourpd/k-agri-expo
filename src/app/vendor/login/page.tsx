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
    const normalizedPassword = password;

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

    if (!normalizedPassword) {
      setError("비밀번호를 입력해 주세요.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/vendor/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: normalizedEmail,
          password: normalizedPassword,
        }),
      });

      let json: LoginResponse | null = null;

      try {
        json = (await res.json()) as LoginResponse;
      } catch {
        json = null;
      }

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "로그인에 실패했습니다.");
      }

      const nextUrl = json.redirectTo || "/vendor";

      /**
       * 중요:
       * SSR 인증 판별 + 쿠키 반영 안정성을 위해
       * client router 대신 전체 이동 사용
       */
      window.location.replace(nextUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "로그인 중 오류가 발생했습니다."
      );
      setLoading(false);
    }
  }

  const canInteract = !loading;

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <section style={S.card}>
          <div style={S.eyebrow}>VENDOR LOGIN</div>
          <h1 style={S.title}>업체 로그인</h1>

          <p style={S.desc}>
            업체 이메일과 비밀번호로 로그인합니다.
            <br />
            로그인 후 부스, 특가, 자료를 관리할 수 있습니다.
          </p>

          <form onSubmit={handleLogin} style={S.form} autoComplete="on" noValidate>
            <label style={S.labelWrap}>
              <div style={S.label}>이메일</div>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="업체 이메일 입력"
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                disabled={!canInteract}
                aria-invalid={!!error}
                style={loading ? S.inputDisabled : S.input}
              />
            </label>

            <label style={S.labelWrap}>
              <div style={S.label}>비밀번호</div>

              <div style={S.passwordWrap}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  autoComplete="current-password"
                  spellCheck={false}
                  disabled={!canInteract}
                  aria-invalid={!!error}
                  style={loading ? S.passwordInputDisabled : S.passwordInput}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={!canInteract}
                  style={loading ? S.toggleBtnDisabled : S.toggleBtn}
                >
                  {showPassword ? "숨기기" : "보기"}
                </button>
              </div>
            </label>

            {error ? (
              <div role="alert" aria-live="polite" style={S.error}>
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!canInteract}
              style={loading ? S.buttonDisabled : S.button}
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>

            <div style={S.bottomRow}>
              <a
                href="/vendor/signup"
                aria-disabled={!canInteract}
                onClick={(e) => {
                  if (!canInteract) e.preventDefault();
                }}
                style={loading ? S.secondaryBtnDisabled : S.secondaryBtn}
              >
                업체 회원가입
              </a>

              <a
                href="/login"
                aria-disabled={!canInteract}
                onClick={(e) => {
                  if (!canInteract) e.preventDefault();
                }}
                style={loading ? S.backLinkDisabled : S.backLink}
              >
                ← 로그인 선택으로
              </a>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#dbeafe",
    padding: 24,
  },
  wrap: {
    maxWidth: 760,
    margin: "0 auto",
  },
  card: {
    marginTop: 40,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 28,
    padding: 40,
    boxShadow: "0 14px 34px rgba(15,23,42,0.05)",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 950,
    color: "#2563eb",
    letterSpacing: 0.5,
  },
  title: {
    marginTop: 12,
    fontSize: 54,
    lineHeight: 1.05,
    fontWeight: 950,
    color: "#111827",
    letterSpacing: -1,
  },
  desc: {
    marginTop: 20,
    fontSize: 16,
    lineHeight: 1.9,
    color: "#64748b",
    maxWidth: 720,
  },
  form: {
    marginTop: 32,
  },
  labelWrap: {
    display: "block",
    marginTop: 18,
  },
  label: {
    marginBottom: 10,
    fontSize: 14,
    fontWeight: 900,
    color: "#111827",
  },
  input: {
    width: "100%",
    height: 58,
    borderRadius: 18,
    border: "1px solid #cbd5e1",
    background: "#dbeafe",
    padding: "0 18px",
    fontSize: 16,
    boxSizing: "border-box",
    outline: "none",
    color: "#111827",
  },
  inputDisabled: {
    width: "100%",
    height: 58,
    borderRadius: 18,
    border: "1px solid #dbe3ef",
    background: "#eff6ff",
    padding: "0 18px",
    fontSize: 16,
    boxSizing: "border-box",
    outline: "none",
    color: "#64748b",
    cursor: "not-allowed",
  },
  passwordWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  passwordInput: {
    flex: 1,
    height: 58,
    borderRadius: 18,
    border: "1px solid #cbd5e1",
    background: "#dbeafe",
    padding: "0 18px",
    fontSize: 16,
    boxSizing: "border-box",
    outline: "none",
    color: "#111827",
  },
  passwordInputDisabled: {
    flex: 1,
    height: 58,
    borderRadius: 18,
    border: "1px solid #dbe3ef",
    background: "#eff6ff",
    padding: "0 18px",
    fontSize: 16,
    boxSizing: "border-box",
    outline: "none",
    color: "#64748b",
    cursor: "not-allowed",
  },
  toggleBtn: {
    height: 58,
    minWidth: 90,
    borderRadius: 18,
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#111827",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
    padding: "0 16px",
  },
  toggleBtnDisabled: {
    height: 58,
    minWidth: 90,
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: 900,
    cursor: "not-allowed",
    padding: "0 16px",
  },
  error: {
    marginTop: 16,
    padding: "12px 14px",
    borderRadius: 12,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontWeight: 800,
    fontSize: 14,
    lineHeight: 1.6,
  },
  button: {
    marginTop: 22,
    width: "100%",
    height: 58,
    border: "none",
    borderRadius: 18,
    background: "#111111",
    color: "#ffffff",
    fontSize: 18,
    fontWeight: 950,
    cursor: "pointer",
  },
  buttonDisabled: {
    marginTop: 22,
    width: "100%",
    height: 58,
    border: "none",
    borderRadius: 18,
    background: "#94a3b8",
    color: "#ffffff",
    fontSize: 18,
    fontWeight: 950,
    cursor: "not-allowed",
    opacity: 0.95,
  },
  bottomRow: {
    marginTop: 26,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  secondaryBtn: {
    padding: "14px 18px",
    borderRadius: 18,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111111",
    fontSize: 14,
    fontWeight: 900,
    textDecoration: "none",
  },
  secondaryBtnDisabled: {
    padding: "14px 18px",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: 900,
    textDecoration: "none",
    pointerEvents: "none",
  },
  backLink: {
    color: "#111111",
    fontSize: 15,
    fontWeight: 900,
    textDecoration: "none",
  },
  backLinkDisabled: {
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: 900,
    textDecoration: "none",
    pointerEvents: "none",
  },
};