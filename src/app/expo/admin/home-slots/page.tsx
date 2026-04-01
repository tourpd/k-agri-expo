import { createSupabaseServerClient } from "@/lib/supabase/server";
import HomeSlotsAdminClient from "./HomeSlotsAdminClient";

export const dynamic = "force-dynamic";

export default async function HomeSlotsAdminPage() {
  const supabase = await createSupabaseServerClient();

  const { data: slots } = await supabase
    .from("expo_home_slots")
    .select("*")
    .order("section_key", { ascending: true })
    .order("slot_order", { ascending: true });

  return <HomeSlotsAdminClient slots={slots ?? []} />;
}