import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/admin-auth";
import { provisionVendorAndBooth } from "@/lib/vendor-provisioning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

type PatchBody = {
  action?: "approve" | "reject" | "confirm_payment" | "unconfirm_payment" | "save_note";
  admin_note?: string;
  rejection_reason?: string;
};

export async function PATCH(
  req: Request,
  context: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { email: adminEmail } = await requireAdminUser();
    const { applicationId } = await context.params;
    const body = (await req.json()) as PatchBody;

    if (!applicationId) {
      return jsonError("applicationId가 필요합니다.");
    }

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

    if (action === "save_note") {
      const { data, error } = await supabase
        .from("vendor_applications_v2")
        .update({
          admin_note: body.admin_note?.trim() || "",
          updated_at: new Date().toISOString(),
        })
        .eq("application_id", applicationId)
        .select("*")
        .single();

      if (error) return jsonError(error.message, 500);
      return Response.json({ success: true, item: data });
    }

    if (action === "confirm_payment") {
      const { data, error } = await supabase
        .from("vendor_applications_v2")
        .update({
          payment_confirmed: true,
          payment_confirmed_at: new Date().toISOString(),
          payment_confirmed_by_email: adminEmail,
          updated_at: new Date().toISOString(),
        })
        .eq("application_id", applicationId)
        .select("*")
        .single();

      if (error) return jsonError(error.message, 500);
      return Response.json({ success: true, item: data });
    }

    if (action === "unconfirm_payment") {
      const { data, error } = await supabase
        .from("vendor_applications_v2")
        .update({
          payment_confirmed: false,
          payment_confirmed_at: null,
          payment_confirmed_by_email: null,
          updated_at: new Date().toISOString(),
        })
        .eq("application_id", applicationId)
        .select("*")
        .single();

      if (error) return jsonError(error.message, 500);
      return Response.json({ success: true, item: data });
    }

    if (action === "reject") {
      const { data, error } = await supabase
        .from("vendor_applications_v2")
        .update({
          status: "rejected",
          rejection_reason: body.rejection_reason?.trim() || "",
          rejected_at: new Date().toISOString(),
          rejected_by_email: adminEmail,
          updated_at: new Date().toISOString(),
        })
        .eq("application_id", applicationId)
        .select("*")
        .single();

      if (error) return jsonError(error.message, 500);
      return Response.json({ success: true, item: data });
    }

    if (action === "approve") {
      if (Number(existing.amount_krw || 0) > 0 && !existing.payment_confirmed) {
        return jsonError("유료 신청은 입금확인 후 승인할 수 있습니다.", 400);
      }

      const nowIso = new Date().toISOString();

      const { data: approved, error: approveError } = await supabase
        .from("vendor_applications_v2")
        .update({
          status: "approved",
          approved_at: nowIso,
          approved_by_email: adminEmail,
          provision_status: "processing",
          updated_at: nowIso,
        })
        .eq("application_id", applicationId)
        .select("*")
        .single();

      if (approveError || !approved) {
        return jsonError(approveError?.message || "승인 처리 실패", 500);
      }

      try {
        const provision = await provisionVendorAndBooth(applicationId);

        const { data: finalRow, error: finalError } = await supabase
          .from("vendor_applications_v2")
          .select("*")
          .eq("application_id", applicationId)
          .single();

        if (finalError || !finalRow) {
          return jsonError(finalError?.message || "최종 결과 조회 실패", 500);
        }

        return Response.json({
          success: true,
          item: finalRow,
          provision,
        });
      } catch (provisionError) {
        const reason =
          provisionError instanceof Error
            ? provisionError.message
            : "부스/벤더 생성 중 오류가 발생했습니다.";

        await supabase
          .from("vendor_applications_v2")
          .update({
            provision_status: "failed",
            provision_result: reason,
            updated_at: new Date().toISOString(),
          })
          .eq("application_id", applicationId);

        return jsonError(reason, 500);
      }
    }

    return jsonError("지원하지 않는 action입니다.", 400);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "상태 변경 중 오류가 발생했습니다.",
      500
    );
  }
}