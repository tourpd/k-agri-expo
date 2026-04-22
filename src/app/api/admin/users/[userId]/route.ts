import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PatchPayload = {
  role?: string;
  status?: string;

  vendor_approval_status?: string;
  plan_type?: string;
  product_limit?: number;
  booth_limit?: number;

  buyer_approval_status?: string;
  buyer_verification_status?: string;

  farmer_status?: string;
};

function cleanString(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function cleanNullableString(v: unknown) {
  const s = cleanString(v);
  return s || null;
}

function cleanNumber(v: unknown) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function loadMergedUser(userId: string) {
  const admin = createSupabaseAdminClient();

  const [profileRes, vendorRes, buyerRes, farmerRes] = await Promise.all([
    admin
      .from("profiles")
      .select("user_id, role, name, phone, email, status, created_at, updated_at")
      .eq("user_id", userId)
      .maybeSingle(),

    admin
      .from("vendors")
      .select("vendor_id, user_id, company_name, approval_status, plan_type, product_limit, booth_limit")
      .eq("user_id", userId)
      .maybeSingle(),

    admin
      .from("buyers")
      .select("buyer_id, user_id, company_name, country, language, approval_status, verification_status")
      .eq("user_id", userId)
      .maybeSingle(),

    admin
      .from("farmers")
      .select("farmer_id, user_id, farm_name, region, crops, status")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (vendorRes.error) throw vendorRes.error;
  if (buyerRes.error) throw buyerRes.error;
  if (farmerRes.error) throw farmerRes.error;

  const p = profileRes.data;
  const v = vendorRes.data;
  const b = buyerRes.data;
  const f = farmerRes.data;

  if (!p) return null;

  return {
    user_id: p.user_id,
    role: p.role ?? null,
    name: p.name ?? null,
    phone: p.phone ?? null,
    email: p.email ?? null,
    status: p.status ?? null,
    created_at: p.created_at ?? null,
    updated_at: p.updated_at ?? null,

    vendor_id: v?.vendor_id ?? null,
    vendor_company_name: v?.company_name ?? null,
    vendor_approval_status: v?.approval_status ?? null,
    plan_type: v?.plan_type ?? null,
    product_limit: v?.product_limit ?? null,
    booth_limit: v?.booth_limit ?? null,

    buyer_id: b?.buyer_id ?? null,
    buyer_company_name: b?.company_name ?? null,
    buyer_country: b?.country ?? null,
    buyer_language: b?.language ?? null,
    buyer_approval_status: b?.approval_status ?? null,
    buyer_verification_status: b?.verification_status ?? null,

    farmer_id: f?.farmer_id ?? null,
    farm_name: f?.farm_name ?? null,
    region: f?.region ?? null,
    crops: f?.crops ?? null,
    farmer_status: f?.status ?? null,
  };
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const userId = cleanString(resolvedParams?.userId);

    if (!userId) {
      return NextResponse.json({ ok: false, error: "userId가 필요합니다." }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as PatchPayload;
    const admin = createSupabaseAdminClient();

    const profilePatch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.role !== undefined) profilePatch.role = cleanNullableString(body.role);
    if (body.status !== undefined) profilePatch.status = cleanNullableString(body.status);

    const { error: profileError } = await admin
      .from("profiles")
      .update(profilePatch)
      .eq("user_id", userId);

    if (profileError) {
      console.error("[api/admin/users/[userId]] profiles update error:", profileError);
      return NextResponse.json(
        { ok: false, error: profileError.message || "profiles 수정 실패" },
        { status: 500 }
      );
    }

    if (
      body.vendor_approval_status !== undefined ||
      body.plan_type !== undefined ||
      body.product_limit !== undefined ||
      body.booth_limit !== undefined
    ) {
      const vendorPatch: Record<string, unknown> = {};

      if (body.vendor_approval_status !== undefined) {
        vendorPatch.approval_status = cleanNullableString(body.vendor_approval_status);
      }
      if (body.plan_type !== undefined) {
        vendorPatch.plan_type = cleanNullableString(body.plan_type);
      }
      if (body.product_limit !== undefined) {
        vendorPatch.product_limit = cleanNumber(body.product_limit);
      }
      if (body.booth_limit !== undefined) {
        vendorPatch.booth_limit = cleanNumber(body.booth_limit);
      }

      const { error: vendorError } = await admin
        .from("vendors")
        .update(vendorPatch)
        .eq("user_id", userId);

      if (vendorError) {
        console.error("[api/admin/users/[userId]] vendors update error:", vendorError);
        return NextResponse.json(
          { ok: false, error: vendorError.message || "vendors 수정 실패" },
          { status: 500 }
        );
      }
    }

    if (
      body.buyer_approval_status !== undefined ||
      body.buyer_verification_status !== undefined
    ) {
      const buyerPatch: Record<string, unknown> = {};

      if (body.buyer_approval_status !== undefined) {
        buyerPatch.approval_status = cleanNullableString(body.buyer_approval_status);
      }
      if (body.buyer_verification_status !== undefined) {
        buyerPatch.verification_status = cleanNullableString(body.buyer_verification_status);
      }

      const { error: buyerError } = await admin
        .from("buyers")
        .update(buyerPatch)
        .eq("user_id", userId);

      if (buyerError) {
        console.error("[api/admin/users/[userId]] buyers update error:", buyerError);
        return NextResponse.json(
          { ok: false, error: buyerError.message || "buyers 수정 실패" },
          { status: 500 }
        );
      }
    }

    if (body.farmer_status !== undefined) {
      const { error: farmerError } = await admin
        .from("farmers")
        .update({ status: cleanNullableString(body.farmer_status) })
        .eq("user_id", userId);

      if (farmerError) {
        console.error("[api/admin/users/[userId]] farmers update error:", farmerError);
        return NextResponse.json(
          { ok: false, error: farmerError.message || "farmers 수정 실패" },
          { status: 500 }
        );
      }
    }

    const item = await loadMergedUser(userId);

    if (!item) {
      return NextResponse.json(
        { ok: false, error: "수정 후 사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        item,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[api/admin/users/[userId]] PATCH error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "사용자 수정 실패",
      },
      {
        status: 500,
      }
    );
  }
}