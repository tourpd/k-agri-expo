import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {

  const { booth_id } = await req.json();

  const supabase = await createSupabaseServerClient();

  await supabase
    .from("booth_visits")
    .insert({
      booth_id,
      created_at: new Date().toISOString(),
    });

  const { count } = await supabase
    .from("booth_visits")
    .select("*", { count: "exact", head: true })
    .eq("booth_id", booth_id);

  return NextResponse.json({
    ok: true,
    visits: count ?? 0,
  });
}