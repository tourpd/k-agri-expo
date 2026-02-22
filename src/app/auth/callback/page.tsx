"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * ✅ 콜백 역할
 * - 매직링크 클릭 후 세션 확정
 * - profiles.role 확인
 *   - 없으면 /onboarding
 *   - 있으면 role에 따라 /vendor 또는 /
 */
export default function AuthCallbackPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();
  const [msg, setMsg] = useState("로그인 처리 중...");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 0) URL에 에러 파라미터가 있으면 먼저 처리
        // (매직링크 실패/만료 등)
        const url = new URL(window.location.href);
        const sp = url.searchParams;

        const errDesc =
          sp.get("error_description") || sp.get("error") || sp.get("error_code");

        if (errDesc) {
          if (!cancelled) {
            setMsg(`로그인 링크 오류: ${decodeURIComponent(errDesc)}`);
          }
          router.replace("/login?force=1");
          return;
        }

        // 1) 세션 확정
        // supabaseBrowser()에서 detectSessionInUrl: true로 이미 처리하지만,
        // 안전하게 getSession/getUser로 확인합니다.
        const { data: sessionData } = await supabase.auth.getSession();
        const { data: userData, error: userErr } = await supabase.auth.getUser();

        if (userErr || !userData?.user) {
          if (!cancelled) setMsg("세션을 확인할 수 없습니다. 다시 로그인해 주세요.");
          router.replace("/login?force=1");
          return;
        }

        const user = userData.user;

        // 2) profiles.role 확인 (id/user_id 둘 다 시도)
        const fetchRole = async () => {
          const r1 = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

          if (!r1.error && r1.data?.role) return String(r1.data.role);

          const r2 = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!r2.error && r2.data?.role) return String(r2.data.role);
          return "";
        };

        const role = await fetchRole();

        // 3) role 없으면 onboarding
        if (!role) {
          if (!cancelled) setMsg("명찰 설정이 필요합니다. 이동합니다...");
          router.replace("/onboarding");
          return;
        }

        // 4) role 있으면 목적지로
        const isVendorRole = role.includes("업체") || role.includes("대리점");
        if (!cancelled) setMsg("완료! 이동합니다...");
        router.replace(isVendorRole ? "/vendor" : "/");
      } catch (e: any) {
        const m = e?.message || "알 수 없는 오류";
        if (!cancelled) setMsg(`콜백 처리 실패: ${m}`);
        router.replace("/login?force=1");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  return (
    <main style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>로그인 처리</h1>
      <p style={{ color: "#444" }}>{msg}</p>
    </main>
  );
}