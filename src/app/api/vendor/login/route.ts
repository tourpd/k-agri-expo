import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { VENDOR_COOKIE_NAME } from "@/lib/vendor-auth";

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

    const email = String(body?.email ?? "").trim().toLowerCase();
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

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return jsonError(error?.message ?? "업체 로그인에 실패했습니다.", 401);
    }

    const userId = data.user.id;
    const userEmail = (data.user.email ?? "").trim().toLowerCase();

    let isVendor = false;

    try {
      const { data: vendor } = await supabase
        .from("vendors")
        .select("user_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (vendor) {
        isVendor = true;
      } else {
        const { data: boothVendor } = await supabase
          .from("booths")
          .select("vendor_user_id")
          .eq("vendor_user_id", userId)
          .limit(1)
          .maybeSingle();

        if (boothVendor) {
          isVendor = true;
        }
      }
    } catch (checkError) {
      console.error("[api/vendor/login] vendor role check error:", checkError);
    }

    if (!isVendor) {
      return jsonError("업체 권한이 없는 계정입니다.", 403);
    }

    const sessionPayload = {
      email: userEmail,
      role: "vendor",
      user_id: userId,
      issuedAt: Date.now(),
      version: "AUTH_BASECAMP_v1",
    };

    const sessionToken = Buffer.from(
      JSON.stringify(sessionPayload),
      "utf-8"
    ).toString("base64url");

    const res = NextResponse.json({
      success: true,
      role: "vendor",
      email: userEmail,
      user_id: userId,
      redirectTo: "/vendor",
    });

    res.cookies.set(VENDOR_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return res;
  } catch (error) {
    console.error("[api/vendor/login] error:", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "업체 로그인 중 오류가 발생했습니다.",
      500
    );
  }
}