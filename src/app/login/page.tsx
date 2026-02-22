"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // ✅ force=1 이면 세션이 있어도 자동 이동 막고 로그인 화면 유지
  const force =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("force") === "1"
      : false;

  useEffect(() => {
    if (force) return;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace("/vendor");
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!force && session) router.replace("/vendor");
    });

    return () => sub.subscription.unsubscribe();
  }, [router, supabase, force]);

  async function sendMagicLink() {
    setBusy(true);
    setMsg(null);

    const origin =
      typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

    // ✅ 메일 링크 클릭 → /auth/callback에서 세션 확정 → /vendor 이동
    const emailRedirectTo = `${origin}/auth/callback?next=/vendor`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    });

    if (error) setMsg(`에러: ${error.message}`);
    else setMsg("메일을 보냈습니다. 받은편지함/스팸함에서 링크를 클릭해 주세요.");

    setBusy(false);
  }

  async function logout() {
    setMsg(null);
    await supabase.auth.signOut();
    router.replace("/login?force=1");
  }

  return (
    <main style={{ padding: 40, maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 10 }}>업체 로그인</h1>
      <p style={{ marginTop: 0, color: "#444" }}>
        이메일로 매직링크를 보내드립니다. 링크 클릭하면 자동 로그인됩니다.
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <button
          onClick={logout}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          로그아웃
        </button>

        <button
          onClick={() => router.replace("/login?force=1")}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          강제로 로그인 화면
        </button>

        <button
          onClick={() => router.replace("/vendor")}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          업체 대시보드
        </button>
      </div>

      <label style={{ display: "block", marginTop: 18, marginBottom: 8, fontWeight: 700 }}>
        이메일
      </label>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="예) company@email.com"
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 10,
          border: "1px solid #ddd",
          fontSize: 16,
        }}
      />

      <button
        onClick={sendMagicLink}
        disabled={busy || !email.includes("@")}
        style={{
          width: "100%",
          marginTop: 14,
          padding: "14px 16px",
          borderRadius: 12,
          border: "none",
          background: "#111",
          color: "#fff",
          fontSize: 16,
          fontWeight: 800,
          cursor: busy ? "not-allowed" : "pointer",
        }}
      >
        {busy ? "보내는 중..." : "매직링크 보내기"}
      </button>

      {msg && (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 12,
            border: "1px solid #eee",
            background: "#fafafa",
            color: "#222",
            lineHeight: 1.6,
          }}
        >
          {msg}
        </div>
      )}
    </main>
  );
}