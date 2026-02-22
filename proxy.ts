import { NextResponse, type NextRequest } from "next/server";

/**
 * ✅ 목적
 * - /vendor, /dashboard 접근은 로그인 필수
 * - profiles(온보딩) 없으면 /onboarding으로 보냄
 *
 * ✅ 장점
 * - @supabase/auth-helpers-nextjs 같은 추가 패키지 없이 동작
 * - 쿠키 기반 세션을 Supabase REST로 확인
 */
export default async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;

  const protectedPrefixes = ["/vendor", "/dashboard"];
  const isProtected = protectedPrefixes.some(
    (p) => path === p || path.startsWith(p + "/")
  );

  if (!isProtected) return NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const cookie = req.headers.get("cookie") ?? "";

  // 1) 로그인 확인
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      cookie,
    },
    cache: "no-store",
  });

  if (!userRes.ok) {
    const to = url.clone();
    to.pathname = "/login";
    to.searchParams.set("force", "1");
    return NextResponse.redirect(to);
  }

  const user = await userRes.json();
  const userId = user?.id as string | undefined;

  if (!userId) {
    const to = url.clone();
    to.pathname = "/login";
    to.searchParams.set("force", "1");
    return NextResponse.redirect(to);
  }

  // 2) profiles(온보딩) 확인
  const profRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?user_id=eq.${userId}&select=user_id&limit=1`,
    {
      method: "GET",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        cookie,
      },
      cache: "no-store",
    }
  );

  // profiles 조회가 실패하면: 정책/테이블 미구성 가능 → 온보딩으로 유도
  if (!profRes.ok) {
    const to = url.clone();
    to.pathname = "/onboarding";
    return NextResponse.redirect(to);
  }

  const prof = await profRes.json();
  const hasProfile = Array.isArray(prof) && prof.length > 0;

  if (!hasProfile && path !== "/onboarding") {
    const to = url.clone();
    to.pathname = "/onboarding";
    return NextResponse.redirect(to);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/vendor/:path*", "/dashboard/:path*"],
};