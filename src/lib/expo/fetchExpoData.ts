export async function fetchExpoData(supabase: any) {
  const [slots, cms, promotions, hotIssues, deals] = await Promise.all([
    supabase.from("expo_home_slots").select("*").eq("is_active", true),
    supabase.from("cms_settings").select("*").eq("id", 1),
    supabase.from("expo_promotions").select("*").eq("is_active", true),
    supabase.from("expo_hot_issues").select("*"),
    supabase.from("expo_deals").select("*"),
  ]);

  return {
    slots: slots.data || [],
    cms: cms.data?.[0] || null,
    promotions: promotions.data || [],
    hotIssues: hotIssues.data || [],
    deals: deals.data || [],
  };
}
