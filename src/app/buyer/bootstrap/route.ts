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
    const contactName =
      typeof body?.contact_name === "string" ? body.contact_name.trim() : "";
    const email =
      typeof body?.email === "string" ? body.email.trim() : user.email ?? "";

    if (!companyName) {
      return Response.json(
        { ok: false, error: "company_name required" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("buyers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return Response.json({ ok: true, buyer: existing });
    }

    const { data: created, error } = await supabase
      .from("buyers")
      .insert({
        user_id: user.id,
        email,
        company_name: companyName,
        contact_name: contactName,
      })
      .select("*")
      .single();

    if (error) {
      return Response.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    return Response.json({ ok: true, buyer: created });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "buyer bootstrap 오류" },
      { status: 500 }
    );
  }
}