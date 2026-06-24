import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function createVendorLeadFromCustomer(customer: any) {
  const supabase = createSupabaseAdminClient();

  if (!customer || customer.type !== "vendor") return;

  return await supabase.from("vendor_leads").upsert({
    customer_id: customer.id,
    title: customer.name || "vendor lead",
    message: customer.note || "",
    source: "auto_crm",
    repurchase_score: customer.repurchase_score || 0,
    created_at: new Date().toISOString(),
  });
}
