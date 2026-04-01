import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { data: vendor } = await supabase
      .from("vendors")
      .select("id,user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!vendor) {
      return Response.json({ ok: false, error: "vendor가 없습니다." }, { status: 404 });
    }

    const { data: booth } = await supabase
      .from("booths")
      .select("booth_id,vendor_id")
      .eq("vendor_id", vendor.id)
      .maybeSingle();

    if (!booth) {
      return Response.json({ ok: false, error: "부스가 없습니다." }, { status: 404 });
    }

    const body = await req.json();

    const patch = {
      name: typeof body?.name === "string" ? body.name.trim() : "",
      region: typeof body?.region === "string" ? body.region.trim() : "",
      category_primary:
        typeof body?.category_primary === "string" ? body.category_primary.trim() : "",
      intro: typeof body?.intro === "string" ? body.intro.trim() : "",
      description: typeof body?.description === "string" ? body.description.trim() : "",
      phone: typeof body?.phone === "string" ? body.phone.trim() : "",
      email: typeof body?.email === "string" ? body.email.trim() : "",
      hall_id: typeof body?.hall_id === "string" ? body.hall_id.trim() : "",
    };

    const { data: updated, error } = await supabase
      .from("booths")
      .update(patch)
      .eq("booth_id", booth.booth_id)
      .select("*")
      .single();

    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 400 });
    }

    return Response.json({ ok: true, booth: updated });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "부스 저장 중 오류" },
      { status: 500 }
    );
  }
}