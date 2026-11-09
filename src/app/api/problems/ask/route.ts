import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCrop } from "@/lib/problems/catalog";
import { matchText } from "@/lib/problems/match";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 농민이 직접 적은 질문 접수
 *
 * 1) 맞는 문제 페이지가 있으면 바로 안내하고 질문도 저장 (어떤 질문이 많은지 알기 위해)
 * 2) 없으면 질문을 저장하고 "24시간 안에 답" — 이 질문이 다음 영상 주제가 됩니다
 *
 * 저장은 expo_inquiries 한 표. source_type = "question", source = "ask" 또는 "ask:<매칭된 slug>"
 */
function s(v: unknown, max = 500) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const question = s(body.question, 1000);
    const phone = s(body.phone, 20).replace(/[^\d]/g, "");
    const name = s(body.farmer_name, 40);
    const region = s(body.region, 60);

    if (question.length < 4) return NextResponse.json({ ok: false, error: "증상을 조금만 더 적어 주세요." }, { status: 400 });

    const m = matchText(question, 3);
    const best = m.problems[0]?.problem ?? null;
    const crop = m.crop ? getCrop(m.crop) : null;

    // 연락처가 있을 때만 저장 (없으면 안내만)
    let saved = false;
    if (phone.length >= 9 && name) {
      try {
        const supabase = createSupabaseAdminClient();
        const now = new Date().toISOString();
        const { error } = await supabase.from("expo_inquiries").insert({
          booth_id: null,
          farmer_name: name,
          phone,
          region: region || null,
          crop: crop?.label ?? "미확인",
          inquiry_type: "question",
          message: question,
          status: "new",
          source: best ? `ask:${best.slug}` : "ask",
          source_type: "question",
          memo: best ? `자동 안내: /p/${best.slug}` : "맞는 문제 페이지 없음 → 영상 주제 후보",
          created_at: now,
          updated_at: now,
        });
        saved = !error;
        if (error) console.error("[problems/ask] insert error:", error);
      } catch (e) {
        console.error("[problems/ask] save error:", e);
      }
    }

    return NextResponse.json({
      ok: true,
      saved,
      crop: crop ? { key: crop.key, label: crop.label } : null,
      problems: m.problems.map((x) => ({ slug: x.problem.slug, title: x.problem.title, summary: x.problem.summary })),
      needs: m.needs.map((x) => ({ slug: x.need.slug, title: x.need.title })),
      notice: best
        ? saved
          ? "비슷한 문제를 찾았습니다. 질문도 접수돼 담당 기업이 연락드립니다."
          : "비슷한 문제를 찾았습니다. 연락처를 남기면 기업이 직접 답해 드립니다."
        : saved
          ? "접수됐습니다. 24시간 안에 답을 드리고, 이 질문은 다음 강의 주제로도 다룹니다."
          : "아직 준비된 답이 없습니다. 이름·연락처를 남기면 24시간 안에 답해 드립니다.",
    });
  } catch (error) {
    console.error("[problems/ask] error:", error);
    return NextResponse.json({ ok: false, error: "처리 중 오류가 났습니다." }, { status: 500 });
  }
}
