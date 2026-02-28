"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const force = sp.get("force") === "1";
  const next = sp.get("next") || "/vendor";

  useEffect(() => {
    if (force) return;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace(next);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!force && session) router.replace(next);
      }
    );

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [router, supabase, force, next]);

  async function sendMagicLink() {
    setBusy(true);
    setMsg(null);

    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";

    const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(
      next
    )}`;

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
    router.replace(`/login?force=1&next=${encodeURIComponent(next)}`);
  }

  return (
    <main style={{ padding: 40, maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 10 }}>업체 로그인</h1>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <button onClick={logout} style={ghostBtn}>
          로그아웃
        </button>

        <button
          onClick={() =>
            router.replace(`/login?force=1&next=${encodeURIComponent(next)}`)
          }
          style={ghostBtn}
        >
          강제로 로그인 화면
        </button>

        <button onClick={() => router.replace(next)} style={ghostBtn}>
          next로 이동
        </button>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
        next: <b>{next}</b>
      </div>

      <label
        style={{
          display: "block",
          marginTop: 18,
          marginBottom: 8,
          fontWeight: 700,
        }}
      >
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
          opacity: busy || !email.includes("@") ? 0.6 : 1,
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
          }}
        >
          {msg}
        </div>
      )}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>로딩 중...</div>}>
      <LoginInner />
    </Suspense>
  );
}

const ghostBtn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 700,
};