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

    const { data: admin } = await supabase
      .from("admins")
      .select("*")
      .eq("email", user.email ?? "")
      .maybeSingle();

    if (!admin) {
      return Response.json(
        { ok: false, error: "관리자 권한이 없습니다." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const applicationId = String(body?.application_id || "").trim();
    const rejectReason = String(body?.reject_reason || "").trim();

    if (!applicationId) {
      return Response.json(
        { ok: false, error: "application_id required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("vendor_applications")
      .update({
        review_status: "rejected",
        reject_reason: rejectReason || "관리자 검토 후 반려",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (error) {
      return Response.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "반려 처리 오류" },
      { status: 500 }
    );
  }
}