import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getProblem } from "@/lib/problems/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 문제 페이지에서 오는 농민 문의 → expo_inquiries 한 표로
 *
 * - 문의가 7개 표로 흩어지던 것을 이 표 하나로 모읍니다.
 * - source = "problem:<slug>", source_type = "problem" 으로 어느 문제에서 왔는지 남깁니다.
 * - booth_id는 농민이 고른 제품의 부스가 있으면 넣고, 없으면 비워 둡니다(운영자 배정).
 */
function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function s(v: unknown, max = 500) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function digits(v: unknown) {
  return s(v).replace(/[^\d]/g, "");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const slug = s(body.problem_slug, 80);
    const problem = getProblem(slug);
    if (!problem) return jsonError("문제 정보를 찾을 수 없습니다.", 404);

    const farmerName = s(body.farmer_name, 40);
    const phone = digits(body.phone);
    const region = s(body.region, 60);
    const message = s(body.message, 1000);
    const productName = s(body.product_name, 120);
    const boothId = s(body.booth_id, 80) || null;
    const agree = body.agree_privacy === true;

    if (!farmerName) return jsonError("이름을 입력해 주세요.");
    if (phone.length < 9 || phone.length > 11) return jsonError("연락 가능한 전화번호를 입력해 주세요.");
    if (!agree) return jsonError("개인정보 수집·이용 동의가 필요합니다.");

    const crop = problem.crop === "common" ? s(body.crop, 40) || "미입력" : problem.title.split(" ")[0];
    const text =
      message ||
      `${problem.title} 관련 문의${productName ? ` (관심 제품: ${productName})` : ""}`;

    const supabase = createSupabaseAdminClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("expo_inquiries")
      .insert({
        booth_id: boothId,
        farmer_name: farmerName,
        phone,
        region: region || null,
        crop,
        inquiry_type: "consult",
        message: text,
        status: "new",
        source: `problem:${problem.slug}`,
        source_type: "problem",
        memo: productName ? `관심 제품: ${productName}` : null,
        created_at: now,
        updated_at: now,
      })
      .select("inquiry_id, created_at")
      .single();

    if (error) {
      console.error("[problem-inquiry] insert error:", error);
      return jsonError("문의 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.", 500);
    }

    return NextResponse.json({
      ok: true,
      inquiry_id: (data as { inquiry_id?: string } | null)?.inquiry_id ?? null,
      notice: "문의가 접수되었습니다. 담당 기업이 연락드립니다.",
    });
  } catch (error) {
    console.error("[problem-inquiry] error:", error);
    return jsonError("문의 처리 중 오류가 났습니다.", 500);
  }
}
