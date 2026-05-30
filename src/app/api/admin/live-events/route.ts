import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("live_events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  return NextResponse.json({ ok: true, events: data });
}

export async function POST(req: Request) {
  const supabase = createSupabaseAdminClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("live_events")
    .insert({
      title: body.title,
      status: "ready",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  return NextResponse.json({ ok: true, event: data });
}