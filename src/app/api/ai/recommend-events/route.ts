import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { phone } = await req.json();

  const supabase = getSupabaseAdmin();

  const { data: farmer } = await supabase
    .from("farmer_profiles")
    .select("*")
    .eq("phone", phone)
    .single();

  const { data: interest } = await supabase
    .from("farmer_interest_profiles")
    .select("*")
    .eq("farmer_id", farmer.farmer_id)
    .single();

  const tags = interest?.interest_tags || [];

  const { data: events } = await supabase
    .from("expo_events")
    .select("*")
    .overlaps("crop_tags", tags)
    .eq("is_active", true);

  return Response.json({
    success: true,
    items: events || [],
  });
}