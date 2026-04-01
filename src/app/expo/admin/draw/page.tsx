import { createSupabaseServerClient } from "@/lib/supabase/server";
import DrawAdminClient from "./DrawAdminClient";

export const dynamic = "force-dynamic";

export default async function ExpoDrawAdminPage() {
  const supabase = await createSupabaseServerClient();

  const { data: entries } = await supabase
    .from("expo_event_entries")
    .select("*")
    .eq("event_key", "monthly_grand_prize")
    .order("created_at", { ascending: false });

  return <DrawAdminClient entries={entries ?? []} />;
}