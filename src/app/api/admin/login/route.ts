import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
  getAdminEnv,
} from "@/lib/admin-auth";
import { safeEqualText } from "@/lib/security/signed-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const email = String(body?.email ?? "")
      .trim()
      .toLowerCase();

    // 비밀번호는 trim 하지 않는 것이 안전합니다.
    const password = String(body?.password ?? "");

    if (!email) {
      return jsonError("이메일을 입력해주세요.", 400);
    }

    if (!email.includes("@")) {
      return jsonError("올바른 이메일 형식으로 입력해주세요.", 400);
    }

    if (!password) {
      return jsonError("비밀번호를 입력해주세요.", 400);
    }

    const { adminEmail, adminPassword } = getAdminEnv();

    const normalizedAdminEmail = adminEmail.trim().toLowerCase();

    if (email !== normalizedAdminEmail || !safeEqualText(password, adminPassword)) {
      return jsonError("관리자 계정 정보가 올바르지 않습니다.", 401);
    }

    // 서명된 세션 토큰 (위조 불가, 12시간 후 만료)
    const sessionToken = await createAdminSessionToken(normalizedAdminEmail);

    const res = NextResponse.json({
      success: true,
      role: "admin",
      email: normalizedAdminEmail,
      redirectTo: "/expo/admin",
    });

    res.cookies.set(ADMIN_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
    });

    return res;
  } catch (error) {
    console.error("[api/admin/login] error:", error);

    // 내부 오류 내용은 밖으로 보내지 않습니다.
    return jsonError("관리자 로그인 중 오류가 발생했습니다.", 500);
  }
}