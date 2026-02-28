"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export const dynamic = "force-dynamic"; // ✅ prerender 방지 (빌드 에러 예방)

function CallbackInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [msg, setMsg] = useState("인증 처리 중...");

  useEffect(() => {
    (async () => {
      try {
        const next = sp.get("next") || "/vendor";

        // ✅ Supabase OAuth/OTP 콜백 URL에 code가 붙는 경우 세션 교환 (PKCE)
        const code = sp.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setMsg(`세션 확정 실패: ${error.message}`);
            return;
          }
        } else {
          // code가 없더라도, 기존 세션이 있으면 그대로 통과
          await supabase.auth.getSession();
        }

        setMsg("인증 완료. 이동 중...");
        router.replace(next);
      } catch (e: any) {
        setMsg(`인증 처리 오류: ${e?.message ?? "unknown"}`);
      }
    })();
  }, [router, sp, supabase]);

  return (
    <main style={{ padding: 40, maxWidth: 860, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 14 }}>인증 처리</h1>
      <div
        style={{
          padding: 14,
          borderRadius: 12,
          border: "1px solid #eee",
          background: "#fafafa",
          lineHeight: 1.7,
          color: "#222",
          whiteSpace: "pre-wrap",
        }}
      >
        {msg}
      </div>

      <div style={{ marginTop: 16 }}>
        <a href="/login" style={{ textDecoration: "underline" }}>
          로그인 화면으로
        </a>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  // ✅ 핵심: useSearchParams를 쓰는 컴포넌트를 Suspense로 감싼다
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>인증 처리 중...</div>}>
      <CallbackInner />
    </Suspense>
  );
}