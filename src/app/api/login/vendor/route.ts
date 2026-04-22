import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VENDOR_COOKIE = "kagri_vendor_session";

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

function normalize(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function encodeSession(data: any) {
  return Buffer.from(JSON.stringify(data), "utf-8").toString("base64");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = normalize(body.email);
    const password = normalize(body.password);

    if (!email) return jsonError("이메일을 입력해주세요.");
    if (!password) return jsonError("비밀번호를 입력해주세요.");

    const supabase = createSupabaseAdminClient();

    // 🔥 벤더 조회
    const { data: vendor, error } = await supabase
      .from("vendors")
      .select(`
        vendor_id,
        email,
        password_hash,
        company_name,
        status
      `)
      .eq("email", email)
      .single();

    if (error || !vendor) {
      return jsonError("존재하지 않는 계정입니다.", 404);
    }

    // 🔥 비밀번호 체크 (간단 버전 - 필요시 bcrypt로 교체)
    if (vendor.password_hash !== password) {
      return jsonError("비밀번호가 일치하지 않습니다.", 401);
    }

    // 🔥 세션 데이터 (여기가 핵심)
    const session = {
      vendor_id: vendor.vendor_id,
      email: vendor.email,
      company_name: vendor.company_name,
      login_at: new Date().toISOString(),
    };

    const encoded = encodeSession(session);

    const res = Response.json({
      success: true,
      item: {
        vendor_id: vendor.vendor_id,
        company_name: vendor.company_name,
      },
    });

    // 🔥 쿠키 저장 (핵심)
    res.headers.append(
      "Set-Cookie",
      `${VENDOR_COOKIE}=${encoded}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
    );

    return res;
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "로그인 오류",
      500
    );
  }
}