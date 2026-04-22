import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ContentManagerClient from "./ui";

export const dynamic = "force-dynamic";

export default async function VendorContentPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login/vendor");

  const admin = createSupabaseAdminClient();

  const { data: booth } = await admin
    .from("booths")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!booth) redirect("/expo/vendor/booth-editor");

  const { data: contents } = await admin
    .from("content_links")
    .select("*")
    .eq("booth_id", booth.booth_id)
    .not("status", "eq", "deleted");

  return <ContentManagerClient boothId={booth.booth_id} contents={contents ?? []} />;
}