import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json(
        { ok: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const inquiryId = String(body?.inquiry_id || "").trim();
    const status = String(body?.status || "").trim();

    if (!inquiryId || !status) {
      return Response.json(
        { ok: false, error: "inquiry_id와 status는 필수입니다." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("expo_inquiries")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("inquiry_id", inquiryId)
      .eq("vendor_user_id", user.id);

    if (error) {
      return Response.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "상태 변경 오류" },
      { status: 500 }
    );
  }
}