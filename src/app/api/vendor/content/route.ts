import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { canAccessBooth, getVendorScope, scopeDenied } from "@/lib/security/vendor-scope";

export async function POST(req: NextRequest) {
  const scope = await getVendorScope();
  if (!scope) return scopeDenied();

  const { boothId, title, url } = await req.json();

  // 본인 부스에만 콘텐츠를 붙일 수 있음
  if (!canAccessBooth(scope, boothId)) {
    return scopeDenied("본인 부스에만 콘텐츠를 등록할 수 있습니다.", 403);
  }

  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("content_links")
    .insert({
      booth_id: boothId,
      title,
      url,
      status: "active",
    })
    .select()
    .single();

  return NextResponse.json({ ok: true, data });
}

export async function DELETE(req: NextRequest) {
  const scope = await getVendorScope();
  if (!scope) return scopeDenied();

  const { id } = await req.json();
  const supabase = createSupabaseAdminClient();

  const { data: row } = await supabase
    .from("content_links")
    .select("booth_id")
    .eq("content_id", id)
    .maybeSingle();

  if (!row || !canAccessBooth(scope, (row as { booth_id?: string | null }).booth_id)) {
    return scopeDenied("본인 부스의 콘텐츠만 지울 수 있습니다.", 403);
  }

  await supabase
    .from("content_links")
    .update({ status: "deleted" })
    .eq("content_id", id);

  return NextResponse.json({ ok: true });
}
