import { createSupabaseServerClient } from "@/lib/supabase/server";
import FeatureSlotsAdminClient from "./FeatureSlotsAdminClient";

export const dynamic = "force-dynamic";

export default async function FeatureSlotsAdminPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: booths }, { data: deals }, { data: slots }] = await Promise.all([
    supabase
      .from("booths")
      .select("booth_id,name,hall_id")
      .order("name", { ascending: true }),

    supabase
      .from("expo_deals")
      .select("deal_id,title,booth_id")
      .order("created_at", { ascending: false }),

    supabase
      .from("expo_feature_slots")
      .select("*")
      .order("slot_group", { ascending: true })
      .order("slot_order", { ascending: true }),
  ]);

  return (
    <FeatureSlotsAdminClient
      booths={booths ?? []}
      deals={deals ?? []}
      slots={slots ?? []}
    />
  );
}