import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
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

    const { data, error } = await supabase
      .from("vendor_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    return Response.json({
      ok: true,
      items: data ?? [],
    });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "신청 목록 조회 오류" },
      { status: 500 }
    );
  }
}