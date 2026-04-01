import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ applicationId: string }> }
) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return jsonError("NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.", 500);
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return jsonError("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.", 500);
    }

    const { applicationId } = await context.params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: app, error } = await supabase
      .from("vendor_applications_v2")
      .select("business_license_bucket, business_license_path")
      .eq("application_id", applicationId)
      .single();

    if (error || !app) {
      return jsonError("신청 정보를 찾지 못했습니다.", 404);
    }

    if (!app.business_license_bucket || !app.business_license_path) {
      return jsonError("업로드된 사업자등록증이 없습니다.", 404);
    }

    const { data, error: signedError } = await supabase.storage
      .from(app.business_license_bucket)
      .createSignedUrl(app.business_license_path, 60 * 10);

    if (signedError || !data?.signedUrl) {
      return jsonError(
        signedError?.message || "열람 링크 생성에 실패했습니다.",
        500
      );
    }

    return Response.json({
      success: true,
      signedUrl: data.signedUrl,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "사업자등록증 열람 중 오류가 발생했습니다.",
      500
    );
  }
}