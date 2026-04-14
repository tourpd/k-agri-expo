"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail) {
      setErrorText("이메일을 입력해 주세요.");
      return;
    }

    if (!normalizedEmail.includes("@")) {
      setErrorText("올바른 이메일 형식으로 입력해 주세요.");
      return;
    }

    if (!normalizedPassword) {
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
          email: normalizedEmail,
          password: normalizedPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorText(data.error || "로그인에 실패했습니다.");
        return;
      }

      router.push("/vendor/manage");
      router.refresh();
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={S.page}>
      <div style={S.card}>
        <div style={S.eyebrow}>ADMIN LOGIN</div>

        <h1 style={S.title}>관리자 로그인</h1>

        <p style={S.desc}>
          관리자 이메일과 비밀번호를 입력해 로그인합니다.
          <br />
          로그인 후 업체 승인, 입금 확인, 부스 운영을 관리할 수 있습니다.
        </p>

        <form onSubmit={onSubmit} style={S.form}>
          <div>
            <label style={S.label}>관리자 이메일</label>
            <input
              type="email"
              style={S.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="예: admin@kagri-expo.com"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          <div>
            <label style={S.label}>비밀번호</label>

            <div style={S.passwordWrap}>
              <input
                type={showPassword ? "text" : "password"}
                style={S.passwordInput}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                autoComplete="current-password"
              />

              <button
                type="button"
                style={S.toggleBtn}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "숨김" : "보기"}
              </button>
            </div>
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
    outline: "none",
    background: "#fff",
  },
  passwordWrap: {
    position: "relative",
  },
  passwordInput: {
    width: "100%",
    padding: "18px 76px 18px 18px",
    borderRadius: 18,
    border: "1px solid #dbe2ea",
    boxSizing: "border-box",
    fontSize: 18,
    outline: "none",
    background: "#fff",
  },
  toggleBtn: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    color: "#475569",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    padding: "8px 10px",
    borderRadius: 10,
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
    opacity: 1,
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