import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeString(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function containsText(value: unknown, q: string) {
  return String(value || "").toLowerCase().includes(q);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const q = safeString(searchParams.get("q"));
    const role = safeString(searchParams.get("role"));
    const status = safeString(searchParams.get("status"));

    const admin = createSupabaseAdminClient();

    const [profilesRes, vendorsRes, buyersRes, farmersRes] = await Promise.all([
      admin
        .from("profiles")
        .select("user_id, role, name, phone, email, status, created_at, updated_at")
        .order("created_at", { ascending: false }),

      admin
        .from("vendors")
        .select("vendor_id, user_id, company_name, approval_status, plan_type, product_limit, booth_limit"),

      admin
        .from("buyers")
        .select("buyer_id, user_id, company_name, country, language, approval_status, verification_status"),

      admin
        .from("farmers")
        .select("farmer_id, user_id, farm_name, region, crops, status"),
    ]);

    if (profilesRes.error) throw profilesRes.error;
    if (vendorsRes.error) throw vendorsRes.error;
    if (buyersRes.error) throw buyersRes.error;
    if (farmersRes.error) throw farmersRes.error;

    const vendorMap = new Map<string, any>();
    for (const row of vendorsRes.data ?? []) {
      if (row.user_id) vendorMap.set(String(row.user_id), row);
    }

    const buyerMap = new Map<string, any>();
    for (const row of buyersRes.data ?? []) {
      if (row.user_id) buyerMap.set(String(row.user_id), row);
    }

    const farmerMap = new Map<string, any>();
    for (const row of farmersRes.data ?? []) {
      if (row.user_id) farmerMap.set(String(row.user_id), row);
    }

    let items = (profilesRes.data ?? []).map((profile: any) => {
      const userId = String(profile.user_id);
      const vendor = vendorMap.get(userId);
      const buyer = buyerMap.get(userId);
      const farmer = farmerMap.get(userId);

      return {
        user_id: userId,
        role: profile.role ?? null,
        name: profile.name ?? null,
        phone: profile.phone ?? null,
        email: profile.email ?? null,
        status: profile.status ?? null,
        created_at: profile.created_at ?? null,
        updated_at: profile.updated_at ?? null,

        vendor_id: vendor?.vendor_id ?? null,
        vendor_company_name: vendor?.company_name ?? null,
        vendor_approval_status: vendor?.approval_status ?? null,
        plan_type: vendor?.plan_type ?? null,
        product_limit: vendor?.product_limit ?? null,
        booth_limit: vendor?.booth_limit ?? null,

        buyer_id: buyer?.buyer_id ?? null,
        buyer_company_name: buyer?.company_name ?? null,
        buyer_country: buyer?.country ?? null,
        buyer_language: buyer?.language ?? null,
        buyer_approval_status: buyer?.approval_status ?? null,
        buyer_verification_status: buyer?.verification_status ?? null,

        farmer_id: farmer?.farmer_id ?? null,
        farm_name: farmer?.farm_name ?? null,
        region: farmer?.region ?? null,
        crops: farmer?.crops ?? null,
        farmer_status: farmer?.status ?? null,
      };
    });

    if (role) {
      items = items.filter((item) => String(item.role || "") === role);
    }

    if (status) {
      items = items.filter((item) => String(item.status || "") === status);
    }

    if (q) {
      const ql = q.toLowerCase();
      items = items.filter((item) => {
        return [
          item.user_id,
          item.role,
          item.name,
          item.phone,
          item.email,
          item.status,
          item.vendor_company_name,
          item.vendor_approval_status,
          item.buyer_company_name,
          item.buyer_country,
          item.buyer_language,
          item.buyer_approval_status,
          item.farm_name,
          item.region,
          item.crops,
        ].some((field) => containsText(field, ql));
      });
    }

    return NextResponse.json(
      {
        ok: true,
        items,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[api/admin/users] GET error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "사용자 목록 조회 실패",
      },
      {
        status: 500,
      }
    );
  }
}