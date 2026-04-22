import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import AdminUsersClient from "./AdminUsersClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type AdminUserRow = {
  user_id: string;
  role?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  vendor_id?: string | null;
  vendor_company_name?: string | null;
  vendor_approval_status?: string | null;
  plan_type?: string | null;
  product_limit?: number | null;
  booth_limit?: number | null;

  buyer_id?: string | null;
  buyer_company_name?: string | null;
  buyer_country?: string | null;
  buyer_language?: string | null;
  buyer_approval_status?: string | null;
  buyer_verification_status?: string | null;

  farmer_id?: string | null;
  farm_name?: string | null;
  region?: string | null;
  crops?: string | null;
  farmer_status?: string | null;
};

function safeString(v: unknown) {
  return typeof v === "string" ? v : "";
}

function safeNullableString(v: unknown) {
  const s = safeString(v).trim();
  return s || null;
}

function safeNumber(v: unknown) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default async function AdminUsersPage() {
  const admin = createSupabaseAdminClient();

  const [profilesRes, vendorsRes, buyersRes, farmersRes] = await Promise.all([
    admin
      .from("profiles")
      .select("user_id, role, name, phone, email, status, created_at, updated_at")
      .order("created_at", { ascending: false }),

    admin
      .from("vendors")
      .select(
        "vendor_id, user_id, company_name, approval_status, plan_type, product_limit, booth_limit"
      ),

    admin
      .from("buyers")
      .select(
        "buyer_id, user_id, company_name, country, language, approval_status, verification_status"
      ),

    admin
      .from("farmers")
      .select("farmer_id, user_id, farm_name, region, crops, status"),
  ]);

  if (profilesRes.error) {
    console.error("[admin/users/page] profiles error:", profilesRes.error);
  }
  if (vendorsRes.error) {
    console.error("[admin/users/page] vendors error:", vendorsRes.error);
  }
  if (buyersRes.error) {
    console.error("[admin/users/page] buyers error:", buyersRes.error);
  }
  if (farmersRes.error) {
    console.error("[admin/users/page] farmers error:", farmersRes.error);
  }

  const vendorMap = new Map<string, any>();
  for (const row of vendorsRes.data ?? []) {
    const userId = safeString(row.user_id);
    if (userId) vendorMap.set(userId, row);
  }

  const buyerMap = new Map<string, any>();
  for (const row of buyersRes.data ?? []) {
    const userId = safeString(row.user_id);
    if (userId) buyerMap.set(userId, row);
  }

  const farmerMap = new Map<string, any>();
  for (const row of farmersRes.data ?? []) {
    const userId = safeString(row.user_id);
    if (userId) farmerMap.set(userId, row);
  }

  const rows: AdminUserRow[] = (profilesRes.data ?? []).map((profile: any) => {
    const userId = safeString(profile.user_id);
    const vendor = vendorMap.get(userId);
    const buyer = buyerMap.get(userId);
    const farmer = farmerMap.get(userId);

    return {
      user_id: userId,
      role: safeNullableString(profile.role),
      name: safeNullableString(profile.name),
      phone: safeNullableString(profile.phone),
      email: safeNullableString(profile.email),
      status: safeNullableString(profile.status),
      created_at: safeNullableString(profile.created_at),
      updated_at: safeNullableString(profile.updated_at),

      vendor_id: safeNullableString(vendor?.vendor_id),
      vendor_company_name: safeNullableString(vendor?.company_name),
      vendor_approval_status: safeNullableString(vendor?.approval_status),
      plan_type: safeNullableString(vendor?.plan_type),
      product_limit: safeNumber(vendor?.product_limit),
      booth_limit: safeNumber(vendor?.booth_limit),

      buyer_id: safeNullableString(buyer?.buyer_id),
      buyer_company_name: safeNullableString(buyer?.company_name),
      buyer_country: safeNullableString(buyer?.country),
      buyer_language: safeNullableString(buyer?.language),
      buyer_approval_status: safeNullableString(buyer?.approval_status),
      buyer_verification_status: safeNullableString(buyer?.verification_status),

      farmer_id: safeNullableString(farmer?.farmer_id),
      farm_name: safeNullableString(farmer?.farm_name),
      region: safeNullableString(farmer?.region),
      crops: safeNullableString(farmer?.crops),
      farmer_status: safeNullableString(farmer?.status),
    };
  });

  return <AdminUsersClient initialRows={rows} />;
}