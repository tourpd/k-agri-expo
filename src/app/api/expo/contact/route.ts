import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {

  const body = await req.json();

  const supabase = await createSupabaseServerClient();

  await supabase
    .from("expo_leads")
    .insert({
      booth_id: body.booth_id,
      name: body.name,
      phone: body.phone,
      message: body.message,
      created_at: new Date().toISOString(),
    });

  return NextResponse.json({ ok: true });
}