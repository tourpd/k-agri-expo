import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = createSupabaseAdminClient();
  const sp = req.nextUrl.searchParams;

  const q = String(sp.get("q") || "").trim();
  const type = String(sp.get("type") || "all");
  const crop = String(sp.get("crop") || "all");
  const status = String(sp.get("status") || "all");

  let query = supabase
    .from("agri_knowledge_assets")
    .select("*")
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });

  if (type !== "all") query = query.eq("asset_type", type);
  if (crop !== "all") query = query.eq("crop", crop);
  if (status !== "all") query = query.eq("status", status);

  if (q) {
    query = query.or(
      `title.ilike.%${q}%,crop.ilike.%${q}%,disease_name.ilike.%${q}%,summary.ilike.%${q}%,keywords.ilike.%${q}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ ok: false, error: error.message, data: [] }, { status: 200 });
  }

  return NextResponse.json({ ok: true, data: data || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("agri_knowledge_assets")
    .insert({
      asset_type: body.asset_type || "안이영자료",
      title: body.title || "제목 없음",
      crop: body.crop || "",
      disease_name: body.disease_name || "",
      source_name: body.source_name || "",
      source_person: body.source_person || "",
      file_url: body.file_url || "",
      youtube_url: body.youtube_url || "",
      summary: body.summary || "",
      keywords: body.keywords || "",
      use_for: body.use_for || "",
      status: body.status || "사용중",
      priority: Number(body.priority || 3),
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const supabase = createSupabaseAdminClient();

  const id = body.id;
  if (!id) return NextResponse.json({ ok: false, error: "id missing" }, { status: 400 });

  const { data, error } = await supabase
    .from("agri_knowledge_assets")
    .update({
      asset_type: body.asset_type,
      title: body.title,
      crop: body.crop,
      disease_name: body.disease_name,
      source_name: body.source_name,
      source_person: body.source_person,
      file_url: body.file_url,
      youtube_url: body.youtube_url,
      summary: body.summary,
      keywords: body.keywords,
      use_for: body.use_for,
      status: body.status,
      priority: Number(body.priority || 3),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, data });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "id missing" }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("agri_knowledge_assets").delete().eq("id", id);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
