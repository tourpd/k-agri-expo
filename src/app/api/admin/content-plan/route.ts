import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CROPS, PROBLEMS, getCrop } from "@/lib/problems/catalog";
import { NEEDS, getNeed } from "@/lib/problems/needs";
import { cropGrade, getMonthPlan } from "@/lib/problems/season";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 이번 주 강의 주제 추천 — 뉴스공장(아이맥)이 가져다 씁니다.
 *
 * 관리자 쿠키 또는 내부 통행증(x-kagri-internal)으로만 열립니다. (proxy가 막음)
 *
 * 돌려주는 것:
 *  1) 농민이 직접 적은 질문 중 최근 14일치 (답 없는 것 먼저) — 가장 좋은 영상 주제
 *  2) 지금 시기 문제 중 아직 영상이 없는 것
 *  3) 이달의 준비물 중 영상이 없는 것
 *  4) 각 항목에 더보기에 넣을 문제 페이지 주소
 */
export async function GET(req: Request) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || new URL(req.url).origin;
  const plan = getMonthPlan();

  // 1) 농민 질문
  let questions: Array<{ question: string; crop: string | null; region: string | null; asked_at: string; matched_slug: string | null; count: number }> = [];
  try {
    const supabase = createSupabaseAdminClient();
    const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
    const { data } = await supabase
      .from("expo_inquiries")
      .select("message, crop, region, created_at, source, source_type")
      .in("source_type", ["question", "problem"])
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200);

    const grouped = new Map<string, (typeof questions)[number]>();
    for (const r of (data ?? []) as Array<Record<string, unknown>>) {
      const msg = String(r.message ?? "").trim();
      if (msg.length < 4) continue;
      const key = msg.slice(0, 40);
      const src = String(r.source ?? "");
      const matched = src.startsWith("ask:") ? src.slice(4) : src.startsWith("problem:") ? src.slice(8) : null;
      const cur = grouped.get(key);
      if (cur) cur.count += 1;
      else
        grouped.set(key, {
          question: msg,
          crop: (r.crop as string) || null,
          region: (r.region as string) || null,
          asked_at: String(r.created_at ?? ""),
          matched_slug: matched,
          count: 1,
        });
    }
    // 답 없는 것(매칭된 페이지 없음) 먼저, 그다음 많이 물은 순
    questions = Array.from(grouped.values()).sort((a, b) => Number(!!a.matched_slug) - Number(!!b.matched_slug) || b.count - a.count);
  } catch (error) {
    console.error("[content-plan] questions error:", error);
  }

  // 2) 지금 시기 문제 중 영상 없는 것
  const seasonalNoVideo = PROBLEMS.filter((p) => !p.videoUrl && (p.seasonal || cropGrade(p.crop).grade === "now"))
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      crop: getCrop(p.crop)?.label ?? p.crop,
      summary: p.summary,
      actions: p.actions,
      principle: p.principle,
      url: `${origin}/p/${p.slug}`,
      priority: (p.seasonal ? 2 : 0) + (cropGrade(p.crop).grade === "now" ? 1 : 0),
    }))
    .sort((a, b) => b.priority - a.priority);

  // 3) 준비물 중 영상 없는 것
  const needsNoVideo = plan.needs
    .map(getNeed)
    .filter(Boolean)
    .map((n) => ({
      slug: n!.slug,
      title: n!.title,
      why: n!.why,
      checklist: n!.checklist,
      url: `${origin}/need/${n!.slug}`,
    }));

  return NextResponse.json({
    ok: true,
    month: plan.month,
    headline: plan.headline,
    crops_now: CROPS.filter((c) => cropGrade(c.key).grade === "now").map((c) => c.label),
    farmer_questions: questions.slice(0, 30),
    seasonal_problems_without_video: seasonalNoVideo,
    needs_without_video: needsNoVideo,
    totals: { problems: PROBLEMS.length, needs: NEEDS.length },
    how_to_use:
      "강의 1편 = 문제 1개. 제목을 만들면 GET /api/problems/match?q=<제목> 으로 문제 페이지 주소를 받아 더보기 맨 위 쿠팡 문구 아래에 넣으세요. 영상이 올라가면 catalog.ts의 videoUrl에 주소를 적습니다.",
  });
}
