import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("expo_events")
      .select("*")
      .eq("event_id", eventId)
      .single();

    if (error || !data) {
      return jsonError(error?.message || "이벤트를 찾지 못했습니다.", 404);
    }

    return Response.json({
      success: true,
      item: data,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "이벤트 조회 중 오류",
      500
    );
  }
}