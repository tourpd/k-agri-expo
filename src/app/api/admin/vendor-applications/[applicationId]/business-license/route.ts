import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400, extra?: unknown) {
  return Response.json(
    { ok: false, success: false, error: message, extra },
    { status }
  );
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await context.params;

    if (!applicationId) {
      return jsonError("applicationId가 필요합니다.", 400);
    }

    const supabase = getSupabaseAdmin();

    const { data: app, error } = await supabase
      .from("vendor_applications_v2")
      .select(
        `
        id,
        company_name,
        source_file_name,
        source_file_mime,
        business_license_bucket,
        business_license_path,
        business_license_url
      `
      )
      .eq("id", applicationId)
      .single();

    if (error || !app) {
      return jsonError("신청 정보를 찾지 못했습니다.", 404, error?.message);
    }

    // 1차: private bucket signed url 생성 시도
    if (app.business_license_bucket && app.business_license_path) {
      const { data, error: signedError } = await supabase.storage
        .from(app.business_license_bucket)
        .createSignedUrl(app.business_license_path, 60 * 10);

      if (!signedError && data?.signedUrl) {
        return Response.json({
          ok: true,
          success: true,
          company_name: app.company_name || "",
          source_file_name: app.source_file_name || "",
          source_file_mime: app.source_file_mime || "",
          bucket: app.business_license_bucket,
          path: app.business_license_path,
          signedUrl: data.signedUrl,
        });
      }

      // signed url 실패했지만 public url이 있으면 fallback
      if (app.business_license_url) {
        return Response.json({
          ok: true,
          success: true,
          company_name: app.company_name || "",
          source_file_name: app.source_file_name || "",
          source_file_mime: app.source_file_mime || "",
          bucket: app.business_license_bucket,
          path: app.business_license_path,
          signedUrl: app.business_license_url,
          fallback: "public_url",
        });
      }

      return jsonError(
        signedError?.message || "열람 링크 생성에 실패했습니다.",
        500
      );
    }

    // 2차: bucket/path는 없지만 url만 저장된 경우 fallback
    if (app.business_license_url) {
      return Response.json({
        ok: true,
        success: true,
        company_name: app.company_name || "",
        source_file_name: app.source_file_name || "",
        source_file_mime: app.source_file_mime || "",
        bucket: "",
        path: "",
        signedUrl: app.business_license_url,
        fallback: "public_url_only",
      });
    }

    return jsonError("업로드된 사업자등록증이 없습니다.", 404);
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "사업자등록증 열람 중 오류가 발생했습니다.",
      500
    );
  }
}