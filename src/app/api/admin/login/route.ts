import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, getAdminEnv } from "@/lib/admin-auth";

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

    if (email !== normalizedAdminEmail || password !== adminPassword) {
      return jsonError("관리자 계정 정보가 올바르지 않습니다.", 401);
    }

    const sessionPayload = {
      email: normalizedAdminEmail,
      role: "admin",
      issuedAt: Date.now(),
      version: "AUTH_BASECAMP_v1",
    };

    const sessionToken = Buffer.from(
      JSON.stringify(sessionPayload),
      "utf-8"
    ).toString("base64url");

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
      maxAge: 60 * 60 * 12,
    });

    return res;
  } catch (error) {
    console.error("[api/admin/login] error:", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "관리자 로그인 중 오류가 발생했습니다.",
      500
    );
  }
}