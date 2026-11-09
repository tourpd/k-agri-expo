import { NextResponse } from "next/server";
import { matchText } from "@/lib/problems/match";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 제목·질문 한 줄 → 맞는 문제 페이지
 *
 * 뉴스공장: GET /api/problems/match?q=<영상 제목>  → 더보기에 넣을 주소
 * 포토닥터: GET /api/problems/match?q=<작물 진단명>
 *
 * 읽기만 하고 DB를 쓰지 않습니다. 공개.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().slice(0, 300);
  if (q.length < 2) return NextResponse.json({ ok: false, error: "q가 필요합니다." }, { status: 400 });

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || url.origin;
  const m = matchText(q, 3);

  return NextResponse.json(
    {
      ok: true,
      crop: m.crop,
      symptoms: m.symptoms,
      best: m.problems[0]
        ? { slug: m.problems[0].problem.slug, title: m.problems[0].problem.title, url: `${origin}/p/${m.problems[0].problem.slug}` }
        : null,
      problems: m.problems.map((x) => ({ slug: x.problem.slug, title: x.problem.title, url: `${origin}/p/${x.problem.slug}`, score: x.score })),
      needs: m.needs.map((x) => ({ slug: x.need.slug, title: x.need.title, url: `${origin}/need/${x.need.slug}` })),
      crop_url: m.crop && m.crop !== "common" ? `${origin}/crop/${m.crop}` : null,
    },
    { headers: { "Cache-Control": "public, max-age=300" } }
  );
}
