"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Mode = "email" | "phone";

function cleanPhoneKR(input: string) {
  const digits = (input || "").replace(/[^\d]/g, "");
  if (!digits) return "";

  if (digits.startsWith("82")) return `+${digits}`;

  if (digits.startsWith("0")) return `+82${digits.slice(1)}`;

  return `+${digits}`;
}

export default function ExpoAuthPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [mode, setMode] = useState<Mode>((sp.get("mode") as Mode) || "email");

  const [email, setEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneMsg, setPhoneMsg] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);

  const next = sp.get("next") || "/expo/onboarding/role";

  function getOrigin() {
    return window.location.origin;
  }

  async function sendMagicLink() {
    setEmailMsg(null);

    const v = email.trim();
    if (!v || !v.includes("@")) {
      setEmailMsg("이메일을 정확히 입력해 주십시오.");
      return;
    }

    setBusy(true);
    try {
      const redirectTo = `${getOrigin()}/auth/callback?next=${encodeURIComponent(next)}`;

      const { error } = await supabase.auth.signInWithOtp({
        email: v,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) {
        setEmailMsg(`발송 실패: ${error.message}`);
        return;
      }

      setEmailMsg("메일을 보냈습니다. 메일함에서 로그인 링크를 눌러 주십시오.");
    } catch (e: any) {
      setEmailMsg(`오류: ${e?.message ?? "unknown"}`);
    } finally {
      setBusy(false);
    }
  }

  async function sendPhoneOtp() {
    setPhoneMsg(null);

    const p = cleanPhoneKR(phone);
    if (!p || p.length < 10) {
      setPhoneMsg("전화번호를 정확히 입력해 주십시오. (예: 010-1234-5678)");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: p,
        options: { channel: "sms" },
      });

      if (error) {
        setPhoneMsg(`문자 발송 실패: ${error.message}`);
        return;
      }

      setOtpSent(true);
      setPhoneMsg("인증번호(SMS)를 보냈습니다. 도착한 6자리 코드를 입력해 주십시오.");
    } catch (e: any) {
      setPhoneMsg(`오류: ${e?.message ?? "unknown"}`);
    } finally {
      setBusy(false);
    }
  }

  async function verifyPhoneOtp() {
    setPhoneMsg(null);

    const p = cleanPhoneKR(phone);
    const code = otp.trim();

    if (!p) {
      setPhoneMsg("전화번호를 먼저 입력해 주십시오.");
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setPhoneMsg("인증번호 6자리를 입력해 주십시오.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: p,
        token: code,
        type: "sms",
      });

      if (error) {
        setPhoneMsg(`인증 실패: ${error.message}`);
        return;
      }

      router.replace(next);
    } catch (e: any) {
      setPhoneMsg(`오류: ${e?.message ?? "unknown"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={S.page}>
      <div style={S.container}>
        <header style={S.header}>
          <div>
            <div style={S.kicker}>K-Agri Expo</div>
            <h1 style={S.title}>로그인</h1>
            <div style={S.sub}>
              농민/바이어/업체 모두 로그인 후에 혜택(특가·상담·관심부스·리드 관리)을 받을 수 있습니다.
            </div>
          </div>

          <div style={S.headerActions}>
            <Link href="/expo" style={S.btnGhost}>
              엑스포 홈
            </Link>
            <Link href="/expo/deals" style={S.btnGhost}>
              🔥 EXPO 특가
            </Link>
          </div>
        </header>

        <section style={S.tabs}>
          <button
            type="button"
            onClick={() => setMode("email")}
            style={{ ...S.tab, ...(mode === "email" ? S.tabActive : {}) }}
            disabled={busy}
          >
            이메일(바이어/업체)
          </button>
          <button
            type="button"
            onClick={() => setMode("phone")}
            style={{ ...S.tab, ...(mode === "phone" ? S.tabActive : {}) }}
            disabled={busy}
          >
            전화(SMS) (농민)
          </button>
        </section>

        {mode === "email" ? (
          <section style={S.card}>
            <div style={S.cardTitle}>이메일 매직링크 로그인</div>
            <div style={S.cardDesc}>
              메일로 로그인 링크를 보내드립니다. 링크를 누르면 자동으로 로그인됩니다.
            </div>

            <label style={S.label}>이메일</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              style={S.input}
              autoComplete="email"
              inputMode="email"
              disabled={busy}
            />

            <button type="button" onClick={sendMagicLink} style={S.btnPrimary} disabled={busy}>
              {busy ? "발송 중..." : "매직링크 보내기"}
            </button>

            {emailMsg ? <div style={S.msgBox}>{emailMsg}</div> : null}

            <div style={S.hint}>
              * 업체는 보통 이메일이 안정적입니다. (추후 관리자에서 업체 계정/부스 권한 부여)
            </div>
          </section>
        ) : (
          <section style={S.card}>
            <div style={S.cardTitle}>전화번호(SMS) 인증 로그인</div>
            <div style={S.cardDesc}>
              휴대폰 번호로 인증번호(SMS)를 받아 로그인합니다. (실문자 설정 필요)
            </div>

            <label style={S.label}>휴대폰 번호</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-1234-5678"
              style={S.input}
              autoComplete="tel"
              inputMode="tel"
              disabled={busy}
            />

            {!otpSent ? (
              <button type="button" onClick={sendPhoneOtp} style={S.btnPrimary} disabled={busy}>
                {busy ? "전송 중..." : "인증번호 보내기"}
              </button>
            ) : (
              <>
                <label style={{ ...S.label, marginTop: 12 }}>인증번호(6자리)</label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  style={S.input}
                  inputMode="numeric"
                  disabled={busy}
                />

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="button" onClick={verifyPhoneOtp} style={S.btnPrimary} disabled={busy}>
                    {busy ? "확인 중..." : "로그인"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOtp("");
                      setOtpSent(false);
                      setPhoneMsg(null);
                    }}
                    style={S.btnGhost}
                    disabled={busy}
                  >
                    다시 보내기
                  </button>
                </div>
              </>
            )}

            {phoneMsg ? <div style={S.msgBox}>{phoneMsg}</div> : null}

            <div style={S.hint}>
              * 전화번호 수집은 개인정보 이슈가 있으므로: <b>수집 목적/보관기간/동의</b>를 화면 하단에 반드시 표기하는 것이 안전합니다.
            </div>
          </section>
        )}

        <footer style={S.footer}>
          <div style={{ color: "#666", fontSize: 12, lineHeight: 1.7 }}>
            로그인 후에는 역할(농민/바이어/업체)을 선택하고, 필요한 정보만 최소로 받는 구조로 운영합니다.
          </div>
          <div style={{ marginTop: 10 }}>
            <Link href="/expo/onboarding/role" style={S.link}>
              역할 선택으로 바로 가기 →
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#fff", padding: "26px 16px", color: "#111" },
  container: { maxWidth: 980, margin: "0 auto" },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 14,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  kicker: { fontSize: 12, fontWeight: 900, color: "#666" },
  title: { margin: "6px 0 0", fontSize: 30, fontWeight: 950, letterSpacing: -0.2 },
  sub: { marginTop: 8, color: "#666", fontSize: 13, lineHeight: 1.7, maxWidth: 680 },

  headerActions: { display: "flex", gap: 10, flexWrap: "wrap" },

  tabs: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 },
  tab: {
    padding: "10px 12px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontWeight: 950,
    cursor: "pointer",
  },
  tabActive: { background: "#111", color: "#fff", border: "1px solid #111" },

  card: {
    marginTop: 14,
    border: "1px solid #eee",
    borderRadius: 18,
    padding: 16,
    background: "#fafafa",
  },
  cardTitle: { fontSize: 16, fontWeight: 950 },
  cardDesc: { marginTop: 8, color: "#555", fontSize: 13, lineHeight: 1.7 },

  label: { display: "block", marginTop: 14, fontSize: 12, fontWeight: 900, color: "#666" },
  input: {
    width: "100%",
    marginTop: 8,
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontSize: 14,
    outline: "none",
  },

  btnPrimary: {
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
  },
  btnGhost: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #ddd",
    background: "#fff",
    color: "#111",
    fontWeight: 950,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
  },

  msgBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    border: "1px solid #eee",
    background: "#fff",
    color: "#111",
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
    fontSize: 13,
  },

  hint: { marginTop: 12, fontSize: 12, color: "#777", lineHeight: 1.7 },

  footer: {
    marginTop: 18,
    paddingTop: 12,
    borderTop: "1px solid #eee",
  },
  link: { fontWeight: 950, color: "#111", textDecoration: "none" },
};