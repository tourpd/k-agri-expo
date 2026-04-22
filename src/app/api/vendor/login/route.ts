import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { VENDOR_COOKIE_NAME } from "@/lib/vendor-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VendorLookupRow = {
  user_id?: string | null;
};

type BoothLookupRow = {
  vendor_user_id?: string | null;
};

function buildNoStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

function jsonError(message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status,
      headers: buildNoStoreHeaders(),
    }
  );
}

function clearLegacyVendorCookie(res: NextResponse) {
  res.cookies.set(VENDOR_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function setLegacyVendorCookie(
  res: NextResponse,
  payload: {
    email: string;
    role: string;
    user_id: string;
    issuedAt: number;
    version: string;
  }
) {
  const sessionToken = Buffer.from(
    JSON.stringify(payload),
    "utf-8"
  ).toString("base64url");

  res.cookies.set(VENDOR_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

async function hasVendorAccess(userId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const admin = createSupabaseAdminClient();

    const vendorResult = await admin
      .from("vendors")
      .select("user_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (vendorResult.error) {
      console.error("[api/vendor/login] vendors lookup error:", vendorResult.error);
    }

    const vendor = (vendorResult.data ?? null) as VendorLookupRow | null;

    if (vendor?.user_id) {
      console.log("[api/vendor/login] vendor access granted by vendors table:", {
        userId,
      });
      return true;
    }

    const boothResult = await admin
      .from("booths")
      .select("vendor_user_id")
      .eq("vendor_user_id", userId)
      .limit(1)
      .maybeSingle();

    if (boothResult.error) {
      console.error("[api/vendor/login] booths lookup error:", boothResult.error);
    }

    const boothVendor = (boothResult.data ?? null) as BoothLookupRow | null;
    const ok = !!boothVendor?.vendor_user_id;

    console.log("[api/vendor/login] vendor access by booths table:", {
      userId,
      ok,
    });

    return ok;
  } catch (error) {
    console.error("[api/vendor/login] hasVendorAccess exception:", error);
    return false;
  }
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

    /**
     * 중요
     * - 로그인은 반드시 SSR 서버 클라이언트로 수행
     * - 그래야 Supabase auth 세션 쿠키가 서버 응답에 반영됩니다.
     */
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    const user = data?.user ?? null;
    const session = data?.session ?? null;

    if (error || !user?.id || !session) {
      console.error("[api/vendor/login] signInWithPassword failed:", error);

      const res = jsonError(
        error?.message ?? "업체 로그인에 실패했습니다.",
        401
      );

      clearLegacyVendorCookie(res);
      return res;
    }

    const userId = user.id;
    const userEmail = String(user.email ?? "").trim().toLowerCase();

    if (!userEmail) {
      console.error("[api/vendor/login] signed-in user has no email:", {
        userId,
      });

      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error("[api/vendor/login] signOut after missing email error:", signOutError);
      }

      const res = jsonError("로그인 계정 정보가 올바르지 않습니다.", 401);
      clearLegacyVendorCookie(res);
      return res;
    }

    console.log("[api/vendor/login] sign-in success:", {
      userId,
      email: userEmail,
    });

    const isVendor = await hasVendorAccess(userId);

    /**
     * 로그인은 성공했지만 vendor 권한이 없으면
     * - Supabase 세션 제거
     * - legacy vendor 쿠키 제거
     */
    if (!isVendor) {
      try {
        const { error: signOutError } = await supabase.auth.signOut();

        if (signOutError) {
          console.error(
            "[api/vendor/login] signOut after non-vendor error:",
            signOutError
          );
        }
      } catch (signOutException) {
        console.error(
          "[api/vendor/login] signOut after non-vendor exception:",
          signOutException
        );
      }

      const res = jsonError("업체 권한이 없는 계정입니다.", 403);
      clearLegacyVendorCookie(res);
      return res;
    }

    /**
     * 보조용 vendor 쿠키
     * - 주 인증은 Supabase 세션
     * - 기존 코드 호환/디버깅용으로만 유지
     */
    const res = NextResponse.json(
      {
        success: true,
        role: "vendor",
        email: userEmail,
        user_id: userId,
        redirectTo: "/vendor",
      },
      {
        headers: buildNoStoreHeaders(),
      }
    );

    setLegacyVendorCookie(res, {
      email: userEmail,
      role: "vendor",
      user_id: userId,
      issuedAt: Date.now(),
      version: "AUTH_SUPABASE_v3",
    });

    console.log("[api/vendor/login] vendor login completed:", {
      userId,
      email: userEmail,
    });

    return res;
  } catch (error) {
    console.error("[api/vendor/login] error:", error);

    const res = jsonError(
      error instanceof Error
        ? error.message
        : "업체 로그인 중 오류가 발생했습니다.",
      500
    );

    clearLegacyVendorCookie(res);
    return res;
  }
}