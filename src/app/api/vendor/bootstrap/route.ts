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
    const companyName =
      typeof body?.company_name === "string" ? body.company_name.trim() : "";
    const email =
      typeof body?.email === "string" ? body.email.trim() : user.email ?? "";

    if (!companyName) {
      return Response.json(
        { ok: false, error: "company_name required" },
        { status: 400 }
      );
    }

    // 이미 이 user로 vendor가 있으면 그대로 반환
    const { data: existingByUser } = await supabase
      .from("vendors")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingByUser) {
      return Response.json({ ok: true, vendor: existingByUser });
    }

    // 같은 회사명이 이미 있으면 그 row의 user_id만 현재 유저로 연결
    const { data: existingByCompany } = await supabase
      .from("vendors")
      .select("*")
      .eq("company_name", companyName)
      .maybeSingle();

    if (existingByCompany) {
      const { data: updated, error: updateError } = await supabase
        .from("vendors")
        .update({
          user_id: user.id,
          email,
        })
        .eq("id", existingByCompany.id)
        .select("*")
        .single();

      if (updateError) {
        return Response.json(
          { ok: false, error: updateError.message },
          { status: 400 }
        );
      }

      return Response.json({ ok: true, vendor: updated });
    }

    // 없으면 새 vendor 생성
    const { data: created, error: createError } = await supabase
      .from("vendors")
      .insert({
        user_id: user.id,
        email,
        company_name: companyName,
      })
      .select("*")
      .single();

    if (createError) {
      return Response.json(
        { ok: false, error: createError.message },
        { status: 400 }
      );
    }

    return Response.json({ ok: true, vendor: created });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "vendor bootstrap 오류" },
      { status: 500 }
    );
  }
}