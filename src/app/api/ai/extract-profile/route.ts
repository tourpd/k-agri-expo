import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

function normalize(v: any) {
  return typeof v === "string" ? v.trim() : v;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const phone = normalize(body.phone);
    const extracted = body.extracted_data;

    if (!phone) return jsonError("phone 필요");
    if (!extracted) return jsonError("extracted_data 필요");

    const supabase = getSupabaseAdmin();

    // 🔥 기존 farmer 조회
    const { data: existing } = await supabase
      .from("farmer_profiles")
      .select("*")
      .eq("phone", phone)
      .single();

    // 🔥 병합 로직 (기존 + 신규)
    const merged = {
      name: extracted.name || existing?.name || "",
      phone: phone,
      region: extracted.region || existing?.region || "",
      main_crop: extracted.main_crop || existing?.main_crop || "",
      sub_crops: extracted.sub_crops || existing?.sub_crops || [],
      farm_size_py:
        extracted.farm_size_py || existing?.farm_size_py || null,
      farming_years:
        extracted.farming_years || existing?.farming_years || null,
      farming_type:
        extracted.farming_type || existing?.farming_type || "",
      profile_summary:
        extracted.profile_summary || existing?.profile_summary || "",
      updated_at: new Date().toISOString(),
    };

    // 🔥 farmer_profiles 저장
    const { data: farmer, error } = await supabase
      .from("farmer_profiles")
      .upsert(merged, { onConflict: "phone" })
      .select("*")
      .single();

    if (error) return jsonError(error.message, 500);

    const farmerId = farmer.farmer_id;

    // 🔥 장비 정보 저장
    if (extracted.tractor_brand || extracted.tractor_hp) {
      await supabase.from("farmer_equipment_profiles").upsert({
        farmer_id: farmerId,
        tractor_brand: extracted.tractor_brand || null,
        tractor_hp: extracted.tractor_hp || null,
        equipment_summary: extracted.equipment_summary || "",
        updated_at: new Date().toISOString(),
      });
    }

    // 🔥 관심 정보 저장
    if (extracted.interest_tags) {
      await supabase.from("farmer_interest_profiles").upsert({
        farmer_id: farmerId,
        interest_tags: extracted.interest_tags || [],
        purchase_style: extracted.purchase_style || null,
        subsidy_interest: extracted.subsidy_interest || false,
        expected_budget_krw: extracted.expected_budget_krw || null,
        updated_at: new Date().toISOString(),
      });
    }

    // 🔥 AI 추출 로그 저장
    await supabase.from("ai_profile_updates").insert({
      farmer_id: farmerId,
      extracted_data: extracted,
      summary: extracted.profile_summary || "",
      created_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      farmer_id: farmerId,
    });
  } catch (err: any) {
    return jsonError(err?.message || "extract error", 500);
  }
}