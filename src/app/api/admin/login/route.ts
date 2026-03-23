import { NextResponse } from "next/server";
import { getAdminEnv, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body as {
      username?: string;
      password?: string;
    };

    if (!username?.trim() || !password?.trim()) {
      return NextResponse.json(
        { success: false, error: "아이디와 비밀번호를 입력해 주세요." },
        { status: 400 }
      );
    }

    const env = getAdminEnv();

    if (username !== env.username || password !== env.password) {
      return NextResponse.json(
        { success: false, error: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      success: true,
      message: "로그인 성공",
    });

    res.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: env.sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8시간
    });

    return res;
  } catch {
    return NextResponse.json(
      { success: false, error: "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}