import { redirect } from "next/navigation";
import DealsClient from "./ui";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type BoothRow = {
  booth_id: string | null;
};

type VendorRow = {
  id: string;
  user_id: string | null;
  email: string | null;
};

export default async function Page() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login/vendor");
  }

  const admin = createSupabaseAdminClient();

  let vendor: VendorRow | null = null;

  {
    const { data } = await admin
      .from("vendors")
      .select("id, user_id, email")
      .eq("user_id", user.id)
      .maybeSingle();

    vendor = (data as VendorRow | null) ?? null;
  }

  if (!vendor && user.email) {
    const { data } = await admin
      .from("vendors")
      .select("id, user_id, email")
      .eq("email", user.email)
      .maybeSingle();

    vendor = (data as VendorRow | null) ?? null;
  }

  if (!vendor?.id) {
    redirect("/expo/vendor/apply");
  }

  const { data: boothData } = await admin
    .from("booths")
    .select("booth_id")
    .eq("vendor_id", vendor.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const booth = (boothData as BoothRow | null) ?? null;

  if (!booth?.booth_id) {
    redirect("/expo/vendor/booth-editor");
  }

  const { data: deals } = await admin
    .from("expo_deals")
    .select("*")
    .eq("booth_id", booth.booth_id)
    .order("created_at", { ascending: false });

  return <DealsClient boothId={booth.booth_id} deals={deals ?? []} />;
}