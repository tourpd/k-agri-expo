import { redirect } from "next/navigation";
import DealsClient from "./ui";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login/vendor");
  }

  const admin = createSupabaseAdminClient();

  const { data: booth } = await admin
    .from("booths")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!booth) {
    redirect("/expo/vendor/booth-editor");
  }

  const { data: deals } = await admin
    .from("expo_deals")
    .select("*")
    .eq("booth_id", booth.booth_id)
    .order("created_at", { ascending: false });

  return <DealsClient boothId={booth.booth_id} deals={deals ?? []} />;
}