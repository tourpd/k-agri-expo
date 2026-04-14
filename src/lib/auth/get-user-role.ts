import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AppUserRole = "admin" | "vendor" | "buyer" | "farmer" | "unknown";

function normalizeEmail(email?: string | null) {
  return (email ?? "").trim().toLowerCase();
}

function emailInAdminList(email?: string | null) {
  const target = normalizeEmail(email);
  if (!target) return false;

  const raw = process.env.ADMIN_EMAILS ?? "";
  const list = raw
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  return list.includes(target);
}

export async function getUserRole(params: {
  userId?: string | null;
  email?: string | null;
}): Promise<AppUserRole> {
  const userId = params.userId?.trim() || "";
  const email = normalizeEmail(params.email);

  if (!userId && !email) return "unknown";

  if (emailInAdminList(email)) {
    return "admin";
  }

  const supabase = createSupabaseAdminClient();

  if (email) {
    try {
      const { data: adminByEmail } = await supabase
        .from("admins")
        .select("email")
        .eq("email", email)
        .limit(1)
        .maybeSingle();

      if (adminByEmail) return "admin";
    } catch {}

    try {
      const { data: adminUserByEmail } = await supabase
        .from("admin_users")
        .select("email")
        .eq("email", email)
        .limit(1)
        .maybeSingle();

      if (adminUserByEmail) return "admin";
    } catch {}
  }

  if (userId) {
    try {
      const { data: adminByUserId } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (adminByUserId) return "admin";
    } catch {}

    try {
      const { data: adminUserByUserId } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (adminUserByUserId) return "admin";
    } catch {}

    try {
      const { data: vendor } = await supabase
        .from("vendors")
        .select("user_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (vendor) return "vendor";
    } catch {}

    try {
      const { data: boothVendor } = await supabase
        .from("booths")
        .select("vendor_user_id")
        .eq("vendor_user_id", userId)
        .limit(1)
        .maybeSingle();

      if (boothVendor) return "vendor";
    } catch {}

    try {
      const { data: buyer } = await supabase
        .from("buyers")
        .select("user_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (buyer) return "buyer";
    } catch {}

    try {
      const { data: farmer } = await supabase
        .from("farmers")
        .select("user_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (farmer) return "farmer";
    } catch {}
  }

  return "unknown";
}