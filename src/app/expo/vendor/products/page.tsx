import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProductsManagerClient from "./ui";

export const dynamic = "force-dynamic";

export default async function VendorProductsPage() {
  const supabaseUser = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user) {
    redirect("/login/vendor");
  }

  const admin = createSupabaseAdminClient();

  const { data: booth } = await admin
    .from("booths")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!booth?.booth_id) {
    redirect("/expo/vendor/booth-editor");
  }

  const { data: products } = await admin
    .from("products")
    .select("*")
    .eq("booth_id", booth.booth_id)
    .not("status", "eq", "deleted")
    .order("created_at", { ascending: false });

  return <ProductsManagerClient boothId={booth.booth_id} products={products ?? []} />;
}