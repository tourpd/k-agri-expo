"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function VendorLoginPage() {
  const router = useRouter();

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
        body: JSON.stringify({
          email: normalizedEmail,
          password: normalizedPassword,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "로그인에 실패했습니다.");
      }

      // AUTH_BASECAMP_v1 기준: 업체 로그인 성공 후 무조건 /vendor
      router.push("/vendor");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "로그인 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

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

          <form onSubmit={handleLogin} style={S.form} autoComplete="off">
            <label style={S.labelWrap}>
              <div style={S.label}>이메일</div>
              <input
                type="email"
                name="vendor_email"
                style={S.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="업체 이메일 입력"
                autoComplete="off"
                inputMode="email"
              />
            </label>

            <label style={S.labelWrap}>
              <div style={S.label}>비밀번호</div>
              <div style={S.passwordWrap}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="vendor_password"
                  style={S.passwordInput}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  style={S.toggleBtn}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "숨기기" : "보기"}
                </button>
              </div>
            </label>

            {error ? <div style={S.error}>{error}</div> : null}

            <button
              type="submit"
              style={loading ? S.buttonDisabled : S.button}
              disabled={loading}
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>

            <div style={S.bottomRow}>
              <a href="/vendor/signup" style={S.secondaryBtn}>
                업체 회원가입
              </a>
              <a href="/login" style={S.backLink}>
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
    background: "#fff",
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
  },
  toggleBtn: {
    height: 58,
    minWidth: 90,
    borderRadius: 18,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#111827",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
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
  },
  button: {
    marginTop: 22,
    width: "100%",
    height: 58,
    border: "none",
    borderRadius: 18,
    background: "#111111",
    color: "#fff",
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
    color: "#fff",
    fontSize: 18,
    fontWeight: 950,
    cursor: "not-allowed",
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
    background: "#fff",
    color: "#111111",
    fontSize: 14,
    fontWeight: 900,
    textDecoration: "none",
  },
  backLink: {
    color: "#111111",
    fontSize: 15,
    fontWeight: 900,
    textDecoration: "none",
  },
};