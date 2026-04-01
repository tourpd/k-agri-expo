import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("expo_settings")
    .select("*")
    .eq("id", 1)
    .single();

  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("expo_settings")
    .update({
      main_event_id: body.main_event_id,
      entry_open: body.entry_open,
      draw_time_limit_sec: body.draw_time_limit_sec,
      default_winner_count: body.default_winner_count,
      default_public: body.default_public,
      notice_text: body.notice_text,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    return NextResponse.json({ success: false, error: error.message });
  }

  return NextResponse.json({ success: true });
}