import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/admin-auth";
import { provisionVendorAndBooth } from "@/lib/vendor-provisioning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400, extra?: unknown) {
  return Response.json({ success: false, error: message, extra }, { status });
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

type Body = {
  action?: "approve" | "reject" | "confirm_payment" | "unconfirm_payment" | "save_note";
  admin_note?: string;
  rejection_reason?: string;
};

type ProvisionResult = {
  vendorId?: string | null;
  boothId?: string | null;
  reused?: boolean;
  hallId?: string | null;
  slotCode?: string | null;
};

function buildProvisionResultText(result: ProvisionResult) {
  const parts = [
    "자동 부스 생성 완료",
    result.vendorId ? `vendor=${result.vendorId}` : "",
    result.boothId ? `booth=${result.boothId}` : "",
    result.hallId ? `hall=${result.hallId}` : "",
    result.slotCode ? `slot=${result.slotCode}` : "",
    result.reused ? "reused=true" : "",
  ].filter(Boolean);

  return parts.join(" | ");
}

export async function POST(
  req: Request,
  context: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { email: adminEmail } = await requireAdminUser();
    const { applicationId } = await context.params;
    const body = (await req.json()) as Body;

    const action = body.action;
    if (!action) {
      return jsonError("action이 필요합니다.");
    }

    const supabase = getSupabaseAdmin();

    const { data: existing, error: existingError } = await supabase
      .from("vendor_applications_v2")
      .select("*")
      .eq("application_id", applicationId)
      .single();

    if (existingError || !existing) {
      return jsonError("신청 정보를 찾지 못했습니다.", 404);
    }

    const now = new Date().toISOString();

    // 1) 메모 저장
    if (action === "save_note") {
      const { data, error } = await supabase
        .from("vendor_applications_v2")
        .update({
          admin_note: normalizeString(body.admin_note),
          updated_at: now,
        })
        .eq("application_id", applicationId)
        .select("*")
        .single();

      if (error) return jsonError(error.message, 500);
      return Response.json({ success: true, item: data });
    }

    // 2) 입금 확인
    if (action === "confirm_payment") {
      const { data, error } = await supabase
        .from("vendor_applications_v2")
        .update({
          payment_confirmed: true,
          payment_confirmed_at: now,
          payment_confirmed_by_email: adminEmail,
          updated_at: now,
        })
        .eq("application_id", applicationId)
        .select("*")
        .single();

      if (error) return jsonError(error.message, 500);
      return Response.json({ success: true, item: data });
    }

    // 3) 입금 취소
    if (action === "unconfirm_payment") {
      const { data, error } = await supabase
        .from("vendor_applications_v2")
        .update({
          payment_confirmed: false,
          payment_confirmed_at: null,
          payment_confirmed_by_email: null,
          updated_at: now,
        })
        .eq("application_id", applicationId)
        .select("*")
        .single();

      if (error) return jsonError(error.message, 500);
      return Response.json({ success: true, item: data });
    }

    // 4) 반려
    if (action === "reject") {
      const reason = normalizeString(body.rejection_reason);

      if (!reason) {
        return jsonError("반려 사유를 입력해주세요.");
      }

      const { data, error } = await supabase
        .from("vendor_applications_v2")
        .update({
          status: "rejected",
          rejection_reason: reason,
          rejected_at: now,
          rejected_by_email: adminEmail,
          provision_status: "rejected",
          provision_result: "관리자 반려",
          updated_at: now,
        })
        .eq("application_id", applicationId)
        .select("*")
        .single();

      if (error) return jsonError(error.message, 500);
      return Response.json({ success: true, item: data });
    }

    // 5) 승인 + 자동 부스 생성
    if (action === "approve") {
      if (Number(existing.amount_krw || 0) > 0 && !existing.payment_confirmed) {
        return jsonError("유료 신청은 입금확인 후 승인 가능합니다.", 400);
      }

      const approvePayload: Record<string, unknown> = {
        status: "approved",
        approved_at: existing.approved_at || now,
        approved_by_email: existing.approved_by_email || adminEmail,
        provision_status: "processing",
        provision_result: "부스 생성 중",
        updated_at: now,
      };

      const { error: approveError } = await supabase
        .from("vendor_applications_v2")
        .update(approvePayload)
        .eq("application_id", applicationId);

      if (approveError) {
        return jsonError(approveError.message, 500);
      }

      try {
        const result = (await provisionVendorAndBooth(
          applicationId
        )) as ProvisionResult;

        const resultText = buildProvisionResultText(result);

        await supabase
          .from("vendor_applications_v2")
          .update({
            provision_status: "completed",
            provision_result: resultText,
            provisioned_vendor_id: result.vendorId || existing.provisioned_vendor_id || null,
            provisioned_booth_id: result.boothId || existing.provisioned_booth_id || null,
            updated_at: new Date().toISOString(),
          })
          .eq("application_id", applicationId);
      } catch (err) {
        const reason =
          err instanceof Error ? err.message : "부스 생성 실패";

        await supabase
          .from("vendor_applications_v2")
          .update({
            provision_status: "failed",
            provision_result: reason,
            updated_at: new Date().toISOString(),
          })
          .eq("application_id", applicationId);

        return jsonError(`승인은 되었지만 부스 생성 실패: ${reason}`, 500, {
          reason,
        });
      }

      const { data, error } = await supabase
        .from("vendor_applications_v2")
        .select("*")
        .eq("application_id", applicationId)
        .single();

      if (error) {
        return jsonError(error.message || "최종 상태 조회 실패", 500);
      }

      return Response.json({
        success: true,
        item: data,
      });
    }

    return jsonError("지원하지 않는 action입니다.");
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "처리 중 오류",
      500
    );
  }
}