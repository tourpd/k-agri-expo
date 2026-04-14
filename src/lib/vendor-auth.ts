import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const VENDOR_COOKIE_NAME = "kagri_vendor_session";

export type VendorSession = {
  email: string;
  role?: string;
  user_id?: string;
  issuedAt?: number;
  version?: string;
};

export async function getVendorSession(): Promise<VendorSession | null> {
  try {
    const cookieStore = await cookies();

    const allCookies = cookieStore.getAll();
    console.log("[vendor-auth] cookies:", allCookies);

    const raw = cookieStore.get(VENDOR_COOKIE_NAME)?.value;

    console.log("[vendor-auth] raw cookie:", raw);

    if (!raw) {
      console.log("[vendor-auth] ❌ no vendor cookie");
      return null;
    }

    const decoded = Buffer.from(raw, "base64url").toString("utf-8");
    console.log("[vendor-auth] decoded:", decoded);

    const parsed = JSON.parse(decoded);
    console.log("[vendor-auth] parsed:", parsed);

    const email =
      typeof parsed?.email === "string"
        ? parsed.email.trim().toLowerCase()
        : "";

    const user_id =
      typeof parsed?.user_id === "string"
        ? parsed.user_id.trim()
        : "";

    console.log("[vendor-auth] extracted email:", email);
    console.log("[vendor-auth] extracted user_id:", user_id);

    if (!email || !user_id) {
      console.log("[vendor-auth] ❌ invalid session (missing email or user_id)");
      return null;
    }

    const session = {
      email,
      role: typeof parsed?.role === "string" ? parsed.role : undefined,
      user_id,
      issuedAt:
        typeof parsed?.issuedAt === "number" ? parsed.issuedAt : undefined,
      version:
        typeof parsed?.version === "string" ? parsed.version : undefined,
    };

    console.log("[vendor-auth] ✅ session resolved:", session);

    return session;
  } catch (error) {
    console.error("[vendor-auth] getVendorSession decode error:", error);
    return null;
  }
}

export async function isVendorAuthenticated() {
  const session = await getVendorSession();

  console.log("[vendor-auth] isVendorAuthenticated session:", session);

  if (!session?.user_id) {
    console.log("[vendor-auth] ❌ no user_id");
    return false;
  }

  try {
    const supabase = createSupabaseAdminClient();

    const { data: vendor } = await supabase
      .from("vendors")
      .select("user_id, company_name")
      .eq("user_id", session.user_id)
      .limit(1)
      .maybeSingle();

    console.log("[vendor-auth] vendor lookup:", vendor);

    if (vendor) {
      console.log("[vendor-auth] ✅ vendor exists");
      return true;
    }

    const { data: boothVendor } = await supabase
      .from("booths")
      .select("vendor_user_id")
      .eq("vendor_user_id", session.user_id)
      .limit(1)
      .maybeSingle();

    console.log("[vendor-auth] booth lookup:", boothVendor);

    const result = !!boothVendor;

    console.log("[vendor-auth] booth auth result:", result);

    return result;
  } catch (error) {
    console.error("[vendor-auth] isVendorAuthenticated error:", error);
    return false;
  }
}

export async function requireVendorUser() {
  const session = await getVendorSession();

  console.log("[vendor-auth] requireVendorUser session:", session);

  if (!session?.user_id) {
    console.log("[vendor-auth] ❌ redirect → /vendor/login (no session)");
    redirect("/vendor/login");
  }

  const ok = await isVendorAuthenticated();

  console.log("[vendor-auth] auth check result:", ok);

  if (!ok) {
    console.log("[vendor-auth] ❌ redirect → /vendor/login (not authenticated)");
    redirect("/vendor/login");
  }

  console.log("[vendor-auth] ✅ user allowed");

  return session;
}