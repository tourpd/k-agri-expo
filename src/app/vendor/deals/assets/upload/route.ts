import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function safeName(name: string) {
  return name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const ct = req.headers.get("content-type") || "";
  const admin = createSupabaseAdminClient();
  const bucket = "expo-assets";

  // ✅ JSON: youtube 등록
  if (ct.includes("application/json")) {
    const body = await req.json().catch(() => null);
    const deal_id = String(body?.deal_id || "").trim();
    const kind = String(body?.kind || "").trim();
    const title = String(body?.title || "").trim() || null;

    if (!deal_id) return NextResponse.json({ ok: false, error: "MISSING_DEAL_ID" }, { status: 400 });
    if (kind !== "youtube") return NextResponse.json({ ok: false, error: "JSON_ONLY_YOUTUBE" }, { status: 400 });

    const url = String(body?.url || "").trim();
    if (!url) return NextResponse.json({ ok: false, error: "MISSING_URL" }, { status: 400 });

    const { data: inserted, error } = await admin
      .from("deal_assets")
      .insert({
        deal_id,
        kind: "youtube",
        title,
        url,
        storage_path: null,
        sort_order: 0,
        is_active: true,
      })
      .select("id,kind,title,storage_path,url,sort_order,is_active,created_at")
      .single();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, asset: inserted });
  }

  // ✅ multipart: 파일 업로드(image/brochure)
  const fd = await req.formData();
  const deal_id = String(fd.get("deal_id") || "").trim();
  const kind = String(fd.get("kind") || "").trim() as "image" | "brochure";
  const title = String(fd.get("title") || "").trim() || null;
  const file = fd.get("file");

  if (!deal_id) return NextResponse.json({ ok: false, error: "MISSING_DEAL_ID" }, { status: 400 });
  if (kind !== "image" && kind !== "brochure") return NextResponse.json({ ok: false, error: "INVALID_KIND" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "MISSING_FILE" }, { status: 400 });

  const arrayBuf = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuf);

  const ext = safeName(file.name || "file");
  const ts = Date.now();
  const path = `vendors/${user.id}/deals/${deal_id}/${kind}/${ts}_${ext}`;

  const { error: upErr } = await admin.storage.from(bucket).upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });

  if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });

  const { data: inserted, error } = await admin
    .from("deal_assets")
    .insert({
      deal_id,
      kind,
      title,
      storage_path: path,
      url: null,
      sort_order: 0,
      is_active: true,
    })
    .select("id,kind,title,storage_path,url,sort_order,is_active,created_at")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, asset: inserted });
}