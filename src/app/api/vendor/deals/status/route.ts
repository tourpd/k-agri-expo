import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEALS_TABLE = "expo_deals";

type VendorRow = {
  id: string;
  user_id: string | null;
  email: string | null;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function resolveCurrentVendorId() {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "로그인이 필요합니다.", status: 401 as const };
  }

  let vendor: VendorRow | null = null;

  {
    const { data, error } = await admin
      .from("vendors")
      .select("id, user_id, email")
      .eq("user_id", user.id)
      .maybeSingle<VendorRow>();

    if (!error && data) vendor = data;
  }

  if (!vendor && user.email) {
    const { data, error } = await admin
      .from("vendors")
      .select("id, user_id, email")
      .eq("email", user.email)
      .maybeSingle<VendorRow>();

    if (!error && data) vendor = data;
  }

  if (!vendor) {
    return { error: "연결된 업체 정보를 찾지 못했습니다.", status: 404 as const };
  }

  return { vendorId: vendor.id };
}

/**
 * PATCH /api/vendor/deals/status
 * body: { deal_id, status }
 */
export async function PATCH(req: Request) {
  try {
    const admin = createSupabaseAdminClient();
    const resolved = await resolveCurrentVendorId();

    if ("error" in resolved) {
      return jsonError(resolved.error, resolved.status);
    }

    const { vendorId } = resolved;
    const body = await req.json();

    const dealId = normalizeString(body.deal_id);
    const status = normalizeString(body.status);

    if (!dealId) return jsonError("deal_id가 필요합니다.");
    if (!status) return jsonError("status가 필요합니다.");

    const allowed = ["draft", "active", "paused", "ended"];
    if (!allowed.includes(status)) {
      return jsonError("허용되지 않는 상태값입니다.");
    }

    const updatePayload: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "ended") {
      updatePayload.ends_at = new Date().toISOString();
    }

    const { data, error } = await admin
      .from(DEALS_TABLE)
      .update(updatePayload)
      .eq("deal_id", dealId)
      .eq("vendor_id", vendorId)
      .select("*")
      .single();

    if (error || !data) {
      return jsonError(
        `${error?.message || "상태 변경에 실패했습니다."} (테이블명 확인: ${DEALS_TABLE})`,
        500
      );
    }

    return NextResponse.json({
      success: true,
      item: data,
      message: "특가 상태가 변경되었습니다.",
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "상태 변경에 실패했습니다.",
      500
    );
  }
}