import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {

  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("expo_booth_popular_today")
    .select(`
      booth_id,
      visit_count,
      booths (
        booth_id,
        name,
        region,
        category_primary
      )
    `)
    .limit(10);

  return Response.json({
    booths: data ?? []
  });

}