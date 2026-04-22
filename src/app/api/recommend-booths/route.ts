import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const crop = searchParams.get("crop") || "";
  const issue = searchParams.get("issue") || "";

  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("booths")
    .select("booth_id,name,intro,plan_type,is_featured")
    .eq("is_public", true)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("plan_type", { ascending: false })
    .limit(6);

  return Response.json({
    success: true,
    items: data || [],
  });
}