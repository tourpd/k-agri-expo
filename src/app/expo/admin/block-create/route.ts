import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {

  const supabase = await createSupabaseServerClient();

  const body = await req.json();

  const { data } = await supabase
    .from("expo_page_blocks")
    .insert({
      page_id: body.page_id,
      block_type: body.block_type
    })
    .select()
    .single();

  return Response.json(data);
}