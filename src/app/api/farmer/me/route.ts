import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FARMER_ENTRY_COOKIE = "kagri_farmer_entry";

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(FARMER_ENTRY_COOKIE)?.value;

    if (!raw) {
      return Response.json({
        success: true,
        item: null,
      });
    }

    const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));

    return Response.json({
      success: true,
      item: {
        farmer_session_id: parsed?.farmer_session_id || null,
        name: parsed?.name || "",
        phone: parsed?.phone || "",
        region: parsed?.region || "",
        crop: parsed?.crop || "",
        is_verified: !!parsed?.is_verified,
      },
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "농민 정보 조회 중 오류",
      500
    );
  }
}