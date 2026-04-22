import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * 보조/레거시 호환용 쿠키 이름
 * 현재 주 인증은 Supabase auth 세션입니다.
 */
export const VENDOR_COOKIE_NAME = "kagri_vendor_session";

export type VendorSession = {
  email: string;
  role?: string;
  user_id: string;
  issuedAt?: number;
  version?: string;
};

type VendorLookupRow = {
  user_id?: string | null;
  company_name?: string | null;
};

type BoothLookupRow = {
  vendor_user_id?: string | null;
};

type SupabaseAuthUser = {
  id: string;
  email?: string | null;
};

function normalizeEmail(email: string | null | undefined): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

async function getSupabaseUser(): Promise<SupabaseAuthUser | null> {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("[vendor-auth] auth.getUser error:", error);
      return null;
    }

    if (!user?.id) {
      console.log("[vendor-auth] no authenticated supabase user");
      return null;
    }

    const resolvedUser: SupabaseAuthUser = {
      id: user.id,
      email: user.email ?? null,
    };

    console.log("[vendor-auth] supabase user resolved:", {
      id: resolvedUser.id,
      email: resolvedUser.email ?? null,
    });

    return resolvedUser;
  } catch (error) {
    console.error("[vendor-auth] getSupabaseUser exception:", error);
    return null;
  }
}

function toVendorSession(user: SupabaseAuthUser): VendorSession | null {
  const email = normalizeEmail(user.email);

  if (!user.id || !email) {
    console.log("[vendor-auth] invalid user for vendor session", {
      hasUserId: !!user.id,
      hasEmail: !!email,
    });
    return null;
  }

  return {
    email,
    user_id: user.id,
    role: "vendor",
    issuedAt: Math.floor(Date.now() / 1000),
    version: "supabase-session-v3",
  };
}

async function lookupVendorAccessByUserId(userId: string): Promise<boolean> {
  if (!userId) {
    console.log("[vendor-auth] lookupVendorAccessByUserId: empty userId");
    return false;
  }

  try {
    const supabase = createSupabaseAdminClient();

    const vendorResult = await supabase
      .from("vendors")
      .select("user_id, company_name")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (vendorResult.error) {
      console.error("[vendor-auth] vendors lookup error:", vendorResult.error);
    }

    const vendor = (vendorResult.data ?? null) as VendorLookupRow | null;

    if (vendor?.user_id) {
      console.log("[vendor-auth] vendor access granted by vendors table:", {
        userId,
        companyName: vendor.company_name ?? null,
      });
      return true;
    }

    const boothResult = await supabase
      .from("booths")
      .select("vendor_user_id")
      .eq("vendor_user_id", userId)
      .limit(1)
      .maybeSingle();

    if (boothResult.error) {
      console.error("[vendor-auth] booths lookup error:", boothResult.error);
    }

    const boothVendor = (boothResult.data ?? null) as BoothLookupRow | null;
    const hasBoothAccess = !!boothVendor?.vendor_user_id;

    console.log("[vendor-auth] booth-based vendor access:", {
      userId,
      hasBoothAccess,
    });

    return hasBoothAccess;
  } catch (error) {
    console.error("[vendor-auth] lookupVendorAccessByUserId exception:", error);
    return false;
  }
}

export async function getVendorSession(): Promise<VendorSession | null> {
  try {
    const user = await getSupabaseUser();

    if (!user) {
      console.log("[vendor-auth] getVendorSession: no supabase user");
      return null;
    }

    const session = toVendorSession(user);

    if (!session) {
      console.log("[vendor-auth] getVendorSession: failed to build session");
      return null;
    }

    console.log("[vendor-auth] vendor session resolved:", {
      user_id: session.user_id,
      email: session.email,
      version: session.version,
    });

    return session;
  } catch (error) {
    console.error("[vendor-auth] getVendorSession error:", error);
    return null;
  }
}

export async function isVendorAuthenticated(): Promise<boolean> {
  const session = await getVendorSession();

  if (!session?.user_id) {
    console.log("[vendor-auth] isVendorAuthenticated: no session");
    return false;
  }

  const ok = await lookupVendorAccessByUserId(session.user_id);

  console.log("[vendor-auth] isVendorAuthenticated result:", {
    userId: session.user_id,
    ok,
  });

  return ok;
}

export async function requireVendorUser(): Promise<VendorSession> {
  const session = await getVendorSession();

  if (!session?.user_id) {
    console.log("[vendor-auth] requireVendorUser: redirect -> /vendor/login (no session)");
    redirect("/vendor/login");
  }

  const ok = await lookupVendorAccessByUserId(session.user_id);

  if (!ok) {
    console.log("[vendor-auth] requireVendorUser: redirect -> /vendor/login (not vendor)");
    redirect("/vendor/login");
  }

  console.log("[vendor-auth] requireVendorUser: access granted", {
    userId: session.user_id,
    email: session.email,
  });

  return session;
}