import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TABLE = "knowledge_visual_pages";

function pick(row: any, keys: string[], fallback: any = null) {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== "") {
      return row[key];
    }
  }
  return fallback;
}

function normalize(row: any) {
  return {
    id: pick(row, ["id"]),
    source_title: pick(row, ["source_title", "document_title", "file_title", "file_name", "source_name", "pdf_name"], "자료제목 입력 필요"),
    page_number: pick(row, ["page_number", "page_no", "page_index", "page"], null),
    image_url: pick(row, ["image_url", "page_image_url", "storage_url", "public_url", "file_url", "url"], null),
    crop_name: pick(row, ["crop", "crop_name", "crop_type", "ai_crop"], null),
    disease_name: pick(row, ["disease_name", "disease", "pest_name", "pest", "problem_name"], null),
    growth_stage: pick(row, ["growth_stage", "stage"], null),
    key_info: pick(row, ["key_info", "core_info", "main_point", "summary_text", "extracted_text"], null),
    ai_summary: pick(row, ["ai_summary", "summary", "vision_summary"], null),
    action_instruction: pick(row, ["action_guide", "action_instruction", "ai_action_guide", "recommendation"], null),
    broadcast_material: pick(row, ["broadcast_angle", "broadcast_material", "broadcast_idea", "ai_broadcast_topic"], null),
    shorts_material: pick(row, ["shorts_material", "shorts_idea", "ai_shorts_topic"], null),
    pd_memo: pick(row, ["operator_note", "pd_memo", "editor_memo", "memo"], null),
    edit_request: pick(row, ["edit_request", "revision_request"], null),
    next_action: pick(row, ["next_action", "next_task", "todo", "business_use"], null),
    source_name: pick(row, ["source_name", "source", "origin_name"], null),
    source_url: pick(row, ["source_url", "original_url"], null),
    original_location: pick(row, ["original_location", "origin_path", "storage_path"], null),
    db_location: pick(row, ["db_destination", "db_location"], "knowledge_visual_pages"),
    usage_flow: pick(
      row,
      ["usage_flow"],
      "자료화면 → knowledge_visual_pages DB → AI 시각분석 → 판단규칙 DB → 방송소재 → 쇼츠 → 농민상담 답변 → 행동지시"
    ),
    created_at: pick(row, ["created_at"], null),
    raw: row,
  };
}

export async function GET() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .limit(500);

  if (error) {
    return NextResponse.json(
      { items: [], error: error.message },
      { status: 500 }
    );
  }

  const items = (data || []).map(normalize);

  return NextResponse.json({ items });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const supabase = createSupabaseAdminClient();

  if (!body?.id) {
    return NextResponse.json({ error: "id가 없습니다." }, { status: 400 });
  }

  /*
    지금 DB 컬럼명이 아직 확정되지 않았기 때문에
    저장은 실제 존재 가능성이 높은 컬럼만 최소 업데이트한다.
    컬럼 추가가 끝나면 여기서 정식 저장 필드를 확장한다.
  */
  const updateData: Record<string, any> = {};

  if (body.source_title !== undefined) updateData.source_title = body.source_title;
  if (body.crop_name !== undefined) updateData.crop = body.crop_name;
  if (body.disease_name !== undefined) updateData.disease_name = body.disease_name;
  if (body.growth_stage !== undefined) updateData.growth_stage = body.growth_stage;
  if (body.key_info !== undefined) updateData.key_info = body.key_info;
  if (body.ai_summary !== undefined) updateData.ai_summary = body.ai_summary;
  if (body.action_instruction !== undefined) updateData.action_guide = body.action_instruction;
  if (body.broadcast_material !== undefined) updateData.broadcast_angle = body.broadcast_material;
  if (body.pd_memo !== undefined) updateData.operator_note = body.pd_memo;
  if (body.edit_request !== undefined) updateData.edit_request = body.edit_request;
  if (body.next_action !== undefined) updateData.next_action = body.next_action;
  if (body.db_location !== undefined) updateData.db_destination = body.db_location;
  if (body.usage_flow !== undefined) updateData.usage_flow = body.usage_flow;

  const { error } = await supabase
    .from(TABLE)
    .update(updateData)
    .eq("id", body.id);

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
        hint: "저장하려는 컬럼이 DB에 없을 수 있습니다. knowledge_visual_pages 컬럼 확장이 필요합니다.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
