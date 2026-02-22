import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ 예외: 로그인/콜백/정적파일은 통과
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // 나머지 보호 라우트만 체크해서 리다이렉트
  // (여기서 세션/쿠키 확인 로직이 들어감)
  return NextResponse.next();
}