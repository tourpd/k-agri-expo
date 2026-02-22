import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "./src/lib/supabase/middleware";

export async function middleware(req: NextRequest) {
  const { supabase, res } = createSupabaseMiddlewareClient(req);

  // 세션 읽기
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;

  // ✅ 보호할 경로들
  const protectedPaths = ["/dashboard"];

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};