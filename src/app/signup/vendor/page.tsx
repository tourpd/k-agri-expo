"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function VendorSignupPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const cleanEmail = email.trim();

      if (!companyName.trim()) {
        setMsg("회사명을 입력해 주세요.");
        return;
      }

      if (!cleanEmail) {
        setMsg("이메일을 입력해 주세요.");
        return;
      }

      if (password.length < 6) {
        setMsg("비밀번호는 6자 이상으로 입력해 주세요.");
        return;
      }

      if (password !== passwordConfirm) {
        setMsg("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (error) {
        if (error.message?.toLowerCase().includes("too many requests")) {
          setMsg("요청이 너무 많습니다. 1~2분 후 다시 시도해 주세요.");
          return;
        }

        setMsg(`회원가입 실패: ${error.message}`);
        return;
      }

      const needsEmailConfirm = !data?.session && !!data?.user;

      // 이메일 인증 필요: 여기서 끝
      if (needsEmailConfirm) {
        setSignedUp(true);
        setMsg(
          `회원가입이 완료되었습니다. ${cleanEmail} 로 인증 메일을 보냈습니다. 메일 인증 후 참가기업 로그인으로 들어가 주세요.`
        );
        return;
      }

      // 이메일 인증이 꺼져 있어 세션이 바로 생긴 경우만 bootstrap
      const res = await fetch("/api/vendor/bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_name: companyName.trim(),
          contact_name: contactName.trim() || companyName.trim(),
          email: cleanEmail,
          phone: phone.trim(),
          region: region.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        setMsg(`참가기업 계정 초기화 실패: ${json?.error ?? "unknown"}`);
        return;
      }

      router.replace("/vendor");
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
        </p>
        <p style={S.guide}>
          이메일은 로그인 아이디로 사용됩니다. 비밀번호는 직접 정하시면 됩니다.
        </p>

        <form onSubmit={onSubmit} style={S.form}>
          <label style={S.label}>회사명</label>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="예: 대동에그테크"
            style={S.input}
            required
            disabled={signedUp}
          />

          <label style={S.labelBlock}>담당자명</label>
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="예: 홍길동"
            style={S.input}
            disabled={signedUp}
          />

          <label style={S.labelBlock}>이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="예: vendor@company.com"
            style={S.input}
            required
            disabled={signedUp}
          />

          <label style={S.labelBlock}>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 입력"
            style={S.input}
            required
            disabled={signedUp}
          />

          <label style={S.labelBlock}>비밀번호 확인</label>
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="비밀번호 다시 입력"
            style={S.input}
            required
            disabled={signedUp}
          />

          <label style={S.labelBlock}>연락처</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="예: 010-1234-5678"
            style={S.input}
            disabled={signedUp}
          />

          <label style={S.labelBlock}>지역</label>
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="예: 경기 / 충남 / 전북"
            style={S.input}
            disabled={signedUp}
          />

          {!signedUp ? (
            <button type="submit" style={S.primaryBtn} disabled={loading}>
              {loading ? "회원가입 중..." : "회원가입"}
            </button>
          ) : (
            <Link href="/login/vendor" style={S.primaryBtnLink}>
              업체 로그인으로 이동
            </Link>
          )}
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
    maxWidth: 760,
    background: "#fff",
    borderRadius: 28,
    padding: 36,
    boxShadow: "0 24px 70px rgba(15,23,42,0.12)",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#2563eb",
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
  guide: {
    marginTop: 8,
    color: "#64748b",
    lineHeight: 1.7,
    fontSize: 15,
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
  primaryBtnLink: {
    display: "block",
    width: "100%",
    marginTop: 22,
    padding: "16px 18px",
    borderRadius: 16,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 950,
    fontSize: 18,
    textDecoration: "none",
    textAlign: "center" as const,
    boxSizing: "border-box" as const,
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