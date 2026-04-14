import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./getCurrentUser";

export type UserRole = "admin" | "vendor" | "farmer" | "buyer" | "guest";

export type ResolvedUserRole = {
  role: UserRole;
  userId: string | null;
  email: string | null;
  adminId?: string | null;
  vendorId?: string | null;
  farmerId?: string | null;
  buyerId?: string | null;
};

export async function resolveRole(): Promise<ResolvedUserRole> {
  const authUser = await getCurrentUser();

  if (!authUser) {
    return {
      role: "guest",
      userId: null,
      email: null,
      adminId: null,
      vendorId: null,
      farmerId: null,
      buyerId: null,
    };
  }

  const supabase = await createSupabaseServerClient();

  const [adminRes, vendorRes, farmerRes, buyerRes] = await Promise.all([
    supabase
      .from("admins")
      .select("admin_id,user_id")
      .eq("user_id", authUser.id)
      .maybeSingle(),

    supabase
      .from("vendors")
      .select("vendor_id,user_id")
      .eq("user_id", authUser.id)
      .maybeSingle(),

    supabase
      .from("farmers")
      .select("farmer_id,user_id")
      .eq("user_id", authUser.id)
      .maybeSingle(),

    supabase
      .from("buyers")
      .select("buyer_id,user_id")
      .eq("user_id", authUser.id)
      .maybeSingle(),
  ]);

  if (adminRes.data?.admin_id) {
    return {
      role: "admin",
      userId: authUser.id,
      email: authUser.email,
      adminId: adminRes.data.admin_id,
      vendorId: null,
      farmerId: null,
      buyerId: null,
    };
  }

  if (vendorRes.data?.vendor_id) {
    return {
      role: "vendor",
      userId: authUser.id,
      email: authUser.email,
      adminId: null,
      vendorId: vendorRes.data.vendor_id,
      farmerId: null,
      buyerId: null,
    };
  }

  if (farmerRes.data?.farmer_id) {
    return {
      role: "farmer",
      userId: authUser.id,
      email: authUser.email,
      adminId: null,
      vendorId: null,
      farmerId: farmerRes.data.farmer_id,
      buyerId: null,
    };
  }

  if (buyerRes.data?.buyer_id) {
    return {
      role: "buyer",
      userId: authUser.id,
      email: authUser.email,
      adminId: null,
      vendorId: null,
      farmerId: null,
      buyerId: buyerRes.data.buyer_id,
    };
  }

  return {
    role: "guest",
    userId: authUser.id,
    email: authUser.email,
    adminId: null,
    vendorId: null,
    farmerId: null,
    buyerId: null,
  };
}