import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function inferRules(text: string, crop: string) {
  const t = text || "";
  const rules: any[] = [];

  const checks = [
    ["역병", "과습·배수불량", "배수로 정비와 예방 방제", "배수로를 점검하고 초기 증상 포기를 확인하세요."],
    ["탄저", "고온다습·장마", "예방 위주 방제", "장마 전후 병든 잎과 과실을 제거하고 예방 방제를 하세요."],
    ["총채", "고온건조·초기 밀도 증가", "초기 밀도 관리", "끈끈이트랩을 확인하고 초기에 방제하세요."],
    ["응애", "건조·고온", "습도 관리와 초기 방제", "잎 뒷면을 확인하고 발생 초기에 방제하세요."],
    ["엽면시비", "영양 흡수 저하", "엽면시비 보완", "아침이나 해질 무렵 엽면시비를 실시하세요."],
    ["칼슘", "칼슘 부족·생리장해", "칼슘 공급", "착과기에는 칼슘 공급을 점검하세요."],
    ["아미노산", "활착·회복 부족", "아미노산 보완", "생육 회복이 필요할 때 아미노산제를 활용하세요."],
  ];

  for (const [keyword, cause, solution, action] of checks) {
    if (t.includes(keyword)) {
      rules.push({
        crop: crop || "미분류",
        month: "",
        growth_stage: "",
        symptom: keyword,
        cause,
        solution,
        action_guide: action,
        source_text: keyword,
        confidence: 0.82,
      });
    }
  }

  return rules.slice(0, 20);
}

export async function GET() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("youtube_assets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ ok: false, error: error.message, data: [] });
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createSupabaseAdminClient();

    const title = String(body.title || "").trim();
    const video_url = String(body.video_url || "").trim();
    const channel_name = String(body.channel_name || "한국농수산TV").trim();
    const transcript = String(body.transcript || "").trim();
    const crop = String(body.crop || "").trim();

    if (!title || !video_url) {
      return NextResponse.json({ ok: false, error: "제목과 유튜브 URL이 필요합니다." }, { status: 400 });
    }

    const rules = inferRules(transcript + " " + title, crop);

    const { data: asset, error } = await supabase
      .from("youtube_assets")
      .insert({
        channel_name,
        video_url,
        title,
        crop,
        product_names: body.product_names || "",
        expert_names: body.expert_names || "",
        transcript,
        summary: transcript ? transcript.slice(0, 500) : title,
        shorts_count: Math.min(10, Math.max(1, rules.length)),
        rule_count: rules.length,
        status: "analyzed",
      })
      .select("*")
      .single();

    if (error) throw error;

    if (rules.length) {
      await supabase.from("youtube_asset_rules").insert(
        rules.map((r) => ({ ...r, youtube_asset_id: asset.id }))
      );
    }

    return NextResponse.json({ ok: true, asset, rules });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || "유튜브 자산 저장 실패" }, { status: 500 });
  }
}
