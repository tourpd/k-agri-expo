import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await req.json();

    const name =
      typeof body?.name === "string" ? body.name.trim() : "";
    const phoneRaw =
      typeof body?.phone === "string" ? body.phone.trim() : "";
    const region =
      typeof body?.region === "string" ? body.region.trim() : "";
    const crop =
      typeof body?.crop === "string" ? body.crop.trim() : "";

    const phone = onlyDigits(phoneRaw);

    if (!name) {
      return Response.json(
        { ok: false, error: "이름을 입력해 주세요." },
        { status: 400 }
      );
    }

    if (phone.length < 10) {
      return Response.json(
        { ok: false, error: "전화번호를 정확히 입력해 주세요." },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("expo_farmers")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();

    let farmer = existing;

    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from("expo_farmers")
        .update({
          name,
          region,
          crop,
        })
        .eq("id", existing.id)
        .select("*")
        .single();

      if (updateError) {
        return Response.json(
          { ok: false, error: updateError.message },
          { status: 400 }
        );
      }

      farmer = updated;
    } else {
      const { data: created, error: createError } = await supabase
        .from("expo_farmers")
        .insert({
          name,
          phone,
          region,
          crop,
        })
        .select("*")
        .single();

      if (createError) {
        return Response.json(
          { ok: false, error: createError.message },
          { status: 400 }
        );
      }

      farmer = created;
    }

    const cookieStore = await cookies();
    cookieStore.set("expo_farmer_entry", String(farmer.id), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    return Response.json({
      ok: true,
      farmer,
    });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "농민 입장 처리 오류" },
      { status: 500 }
    );
  }
}