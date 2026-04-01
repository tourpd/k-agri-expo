import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {

  const supabase = await createSupabaseServerClient();

  const body = await req.json();

  await supabase
    .from("expo_booth_visits")
    .insert({
      booth_id: body.booth_id
    });

  return Response.json({ ok: true });
}