import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {

  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("expo_product_popular")
    .select(`
      product_id,
      view_count,
      products (
        product_id,
        name,
        description,
        price_text
      )
    `)
    .limit(10);

  return Response.json({
    products: data ?? []
  });

}