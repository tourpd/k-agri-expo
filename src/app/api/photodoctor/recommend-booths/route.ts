import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const cropName = normalize(body.crop_name);
    const issueType = normalize(body.issue_type);

    if (!cropName && !issueType) {
      return jsonError("crop_name 또는 issue_type이 필요합니다.");
    }

    const supabase = createSupabaseAdminClient();

    let query = supabase
      .from("booths")
      .select(`
        booth_id,
        vendor_id,
        hall_id,
        slot_code,
        name,
        category_primary,
        company_type,
        is_featured,
        crop_tags,
        issue_tags,
        is_public,
        is_active,
        is_published,
        status
      `)
      .eq("status", "approved")
      .eq("is_public", true)
      .eq("is_active", true)
      .eq("is_published", true)
      .limit(50);

    const { data, error } = await query;

    if (error) {
      return jsonError(error.message || "추천 부스 조회 실패", 500);
    }

    const items = (data || []).map((row: any) => {
      const cropTags = Array.isArray(row.crop_tags) ? row.crop_tags : [];
      const issueTags = Array.isArray(row.issue_tags) ? row.issue_tags : [];

      let score = 0;
      if (cropName && cropTags.includes(cropName)) score += 30;
      if (issueType && issueTags.includes(issueType)) score += 50;
      if (row.is_featured) score += 20;
      if (row.company_type === "premium") score += 10;

      return {
        ...row,
        score,
      };
    });

    const sorted = items.sort((a, b) => b.score - a.score).slice(0, 5);

    return Response.json({
      success: true,
      items: sorted,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "추천 부스 조회 중 오류",
      500
    );
  }
}