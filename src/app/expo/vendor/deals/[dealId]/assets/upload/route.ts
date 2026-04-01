// src/app/api/vendor/deals/[dealId]/assets/upload/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET = "deal-assets";

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ dealId: string }> }
) {
  const { dealId } = await ctx.params;
  if (!isUuid(dealId)) return new NextResponse("invalid dealId", { status: 400 });

  const supabase = await createSupabaseServerClient();

  const fd = await req.formData();
  const kind = String(fd.get("kind") || "").trim() as any;
  const title = String(fd.get("title") || "").trim() || null;
  const requires_login = String(fd.get("requires_login") || "false") === "true";
  const sort_order = Number(String(fd.get("sort_order") || "0")) || 0;

  if (!["youtube", "image", "pdf", "file"].includes(kind)) {
    return new NextResponse("invalid kind", { status: 400 });
  }

  // 1) 유튜브 링크 등록(파일 없이)
  if (kind === "youtube") {
    const url = String(fd.get("url") || "").trim();
    if (!url) return new NextResponse("missing url", { status: 400 });

    const { error: insErr } = await supabase.from("deal_assets").insert({
      deal_id: dealId,
      kind,
      title,
      url,
      requires_login,
      sort_order,
    });

    if (insErr) return new NextResponse(insErr.message, { status: 400 });

    const { data: assets } = await supabase
      .from("deal_assets")
      .select("asset_id,deal_id,kind,title,url,requires_login,sort_order,created_at")
      .eq("deal_id", dealId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    return NextResponse.json({ ok: true, assets: assets || [] });
  }

  // 2) 파일 업로드 + 자동 등록
  const file = fd.get("file");
  if (!(file instanceof File)) {
    return new NextResponse("missing file", { status: 400 });
  }

  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (kind === "pdf" && ext !== "pdf") {
    return new NextResponse("pdf only", { status: 400 });
  }

  // 업로드 경로: deals/{dealId}/{timestamp}_{filename}
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const path = `deals/${dealId}/${ts}_${safeFileName(file.name)}`;

  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type || (kind === "pdf" ? "application/pdf" : "application/octet-stream"),
    upsert: false,
  });

  if (upErr) return new NextResponse(upErr.message, { status: 400 });

  // public url (버킷이 public이 아니라면 signed url 설계로 바꿔야 합니다)
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = pub?.publicUrl;
  if (!url) return new NextResponse("failed to get public url", { status: 500 });

  const { error: insErr } = await supabase.from("deal_assets").insert({
    deal_id: dealId,
    kind,
    title,
    url,
    requires_login,
    sort_order,
  });

  if (insErr) return new NextResponse(insErr.message, { status: 400 });

  const { data: assets } = await supabase
    .from("deal_assets")
    .select("asset_id,deal_id,kind,title,url,requires_login,sort_order,created_at")
    .eq("deal_id", dealId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return NextResponse.json({ ok: true, assets: assets || [] });
}