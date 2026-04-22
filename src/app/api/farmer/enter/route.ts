import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FARMER_ENTRY_COOKIE = "kagri_farmer_entry";

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = normalize(body.name);
    const phone = onlyDigits(normalize(body.phone));
    const region = normalize(body.region);
    const crop = normalize(body.crop);

    if (!name) return jsonError("이름을 입력해주세요.");
    if (phone.length < 10) return jsonError("전화번호를 정확히 입력해주세요.");

    const supabase = createSupabaseAdminClient();

    const { data: existing } = await supabase
      .from("farmer_sessions")
      .select("*")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let item: any = null;

    if (existing) {
      const { data, error } = await supabase
        .from("farmer_sessions")
        .update({
          name,
          region: region || null,
          crop: crop || null,
          last_entered_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error || !data) {
        return jsonError(error?.message || "농민 입장 갱신 실패", 500);
      }

      item = data;
    } else {
      const { data, error } = await supabase
        .from("farmer_sessions")
        .insert({
          name,
          phone,
          region: region || null,
          crop: crop || null,
          is_verified: false,
          last_entered_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (error || !data) {
        return jsonError(error?.message || "농민 입장 생성 실패", 500);
      }

      item = data;
    }

    const cookieStore = await cookies();
    cookieStore.set(
      FARMER_ENTRY_COOKIE,
      Buffer.from(
        JSON.stringify({
          farmer_session_id: item.id,
          name: item.name,
          phone: item.phone,
          region: item.region,
          crop: item.crop,
          is_verified: !!item.is_verified,
        })
      ).toString("base64"),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      }
    );

    return Response.json({
      success: true,
      item: {
        id: item.id,
        name: item.name,
        phone: item.phone,
        region: item.region,
        crop: item.crop,
        is_verified: !!item.is_verified,
      },
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "농민 입장 처리 중 오류",
      500
    );
  }
}