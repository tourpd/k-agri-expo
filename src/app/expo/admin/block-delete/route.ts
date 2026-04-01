import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {

  const supabase = await createSupabaseServerClient();

  const body = await req.json();

  await supabase
    .from("expo_page_blocks")
    .delete()
    .eq("id", body.id);

  return Response.json({ ok: true });
}