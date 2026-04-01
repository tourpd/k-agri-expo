import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {

  const supabase = await createSupabaseServerClient();

  const body = await req.json();

  const { data: block } = await supabase
    .from("expo_page_blocks")
    .select("*")
    .eq("id", body.id)
    .single();

  let newOrder = block.sort_order;

  if (body.direction === "up") newOrder--;
  if (body.direction === "down") newOrder++;

  await supabase
    .from("expo_page_blocks")
    .update({ sort_order: newOrder })
    .eq("id", body.id);

  return Response.json({ ok: true });
}