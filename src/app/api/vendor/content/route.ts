import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { boothId, title, url } = await req.json();
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
  const { id } = await req.json();
  const supabase = createSupabaseAdminClient();

  await supabase
    .from("content_links")
    .update({ status: "deleted" })
    .eq("content_id", id);

  return NextResponse.json({ ok: true });
}