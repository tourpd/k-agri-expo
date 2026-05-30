import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function VendorProductsPage() {
  const supabaseUser = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user) {
    redirect("/login/vendor");
  }

  const admin = createSupabaseAdminClient();

  const { data: vendor } = await admin
    .from("vendors")
    .select("vendor_id, user_id, company_name")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!vendor?.vendor_id) {
    redirect("/expo/vendor/booth-editor");
  }

  const { data: booths } = await admin
    .from("booths")
    .select("booth_id")
    .eq("vendor_id", vendor.vendor_id);

  const boothIds = (booths ?? [])
    .map((b: any) => String(b.booth_id || ""))
    .filter(Boolean);

  if (boothIds.length === 0) {
    redirect("/expo/vendor/booth-editor");
  }

  const { data: products } = await admin
    .from("expo_products")
    .select("product_id, booth_id, name, title, created_at")
    .in("booth_id", boothIds)
    .order("created_at", { ascending: false });

  const firstProduct = products?.[0];

  if (firstProduct?.product_id) {
    redirect(`/expo/vendor/product-editor?product_id=${firstProduct.product_id}`);
  }

  redirect("/expo/vendor/product-editor");
}