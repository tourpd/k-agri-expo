import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function safe(v: unknown) {
  return String(v ?? "").trim();
}

const KEYWORDS = [
  "기아 PV5 차박",
  "PV5 캠핑카",
  "PV5 카고 차박",
  "PV5 패신저 차박",
  "PV5 오픈격벽",
  "PV5 가구키트",
  "PV5 팝업텐트",
  "PV5 평탄화",
  "PV5 루프탑텐트",
  "PV5 캠핑카 튜닝",
  "PV5 캠핑카 제작",
  "PV5 구조변경",
  "PV5 전장",
  "PV5 냉장고",
  "PV5 침상"
];

function calculateEvidence(video: any) {
  const text = `
    ${video.title || ""}
    ${video.description || ""}
    ${video.channel || ""}
  `.toLowerCase();

  let score = 0;
  const reason: string[] = [];

  const views = Number(video.view_count || 0);
  const viewScore =
    views > 500000 ? 30 :
    views > 200000 ? 20 :
    views > 100000 ? 10 : 0;

  score += viewScore;
  if (viewScore) reason.push(`조회수:${viewScore}`);

  if (/만원|천만원|억원|원/.test(text)) {
    score += 25;
    reason.push("가격정보");
  }

  if (/모터스|레포츠|캠핑카|특장|튜닝|컨버전|제작|시공/.test(text)) {
    score += 25;
    reason.push("업체/시공정보");
  }

  if (/0507-|1577-|1668-|010-|031-|02-/.test(text)) {
    score += 25;
    reason.push("연락처");
  }

  if (/차박|캠핑|루프탑|침상|평탄화|무시동|배터리|히터|에어컨/.test(text)) {
    score += 25;
    reason.push("실사용");
  }

  if (/수납|목공|전장|인버터|냉장고|테이블|전자레인지|격벽|팝업|가구/.test(text)) {
    score += 20;
    reason.push("설계정보");
  }

  if (/60대|부부|가족|아이|반려견|농업|유튜버|장애|휠체어/.test(text)) {
    score += 15;
    reason.push("고객유형");
  }

  if (/official|movement that inspires|하나의 공간|playmobil|플레이모빌/.test(text)) {
    score -= 50;
    reason.push("공식홍보 감점");
  }

  if (/walkaround|1 min|1분/.test(text)) {
    score -= 35;
    reason.push("워크어라운드 감점");
  }

  return {
    score: Math.max(score, 0),
    reason
  };
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "YOUTUBE_API_KEY가 없습니다." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const maxPerKeyword = Number(body.max_per_keyword || 15);
    const minScore = Number(body.min_score || 40);

    const collected: any[] = [];
    const seen = new Set<string>();

    for (const q of KEYWORDS) {
      const searchUrl =
        "https://www.googleapis.com/youtube/v3/search" +
        `?part=snippet&type=video&order=viewCount&maxResults=${maxPerKeyword}` +
        `&q=${encodeURIComponent(q)}&key=${apiKey}`;

      const searchRes = await fetch(searchUrl, { cache: "no-store" });
      const searchData = await searchRes.json();

      const ids = (searchData.items || [])
        .map((x: any) => safe(x?.id?.videoId))
        .filter(Boolean);

      if (ids.length === 0) continue;

      const detailUrl =
        "https://www.googleapis.com/youtube/v3/videos" +
        `?part=snippet,statistics&id=${ids.join(",")}&key=${apiKey}`;

      const detailRes = await fetch(detailUrl, { cache: "no-store" });
      const detailData = await detailRes.json();

      for (const item of detailData.items || []) {
        const videoId = safe(item.id);
        if (!videoId || seen.has(videoId)) continue;
        seen.add(videoId);

        const snippet = item.snippet || {};
        const stats = item.statistics || {};
        const url = `https://youtu.be/${videoId}`;

        const video = {
          video_id: videoId,
          video_url: url,
          title: safe(snippet.title),
          channel: safe(snippet.channelTitle),
          description: safe(snippet.description),
          published_at: safe(snippet.publishedAt),
          view_count: Number(stats.viewCount || 0),
          thumbnail:
            safe(snippet.thumbnails?.high?.url) ||
            safe(snippet.thumbnails?.medium?.url) ||
            `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          keyword: q,
          raw: item,
        };

        const evidence = calculateEvidence(video);

        if (evidence.score < minScore) continue;

        collected.push({
          ...video,
          evidence_score: evidence.score,
          evidence_reason: evidence.reason,
        });
      }
    }

    collected.sort((a, b) => {
      if (b.evidence_score !== a.evidence_score) {
        return b.evidence_score - a.evidence_score;
      }
      return b.view_count - a.view_count;
    });

    const rows = collected.map((x) => ({
      video_id: x.video_id,
      video_url: x.video_url,
      title: x.title,
      channel: x.channel,
      description: x.description,
      published_at: x.published_at || null,
      view_count: x.view_count,
      thumbnail_url: x.thumbnail,
      keyword: x.keyword,
      raw_data: x.raw,
      evidence_score: x.evidence_score,
      evidence_reason: x.evidence_reason,
      status: "discovered",
    }));

    const saved = await supabase
      .from("pv5_youtube_discovery")
      .upsert(rows, { onConflict: "video_id" })
      .select("id, video_id");

    if (saved.error) {
      return NextResponse.json(
        { success: false, error: saved.error.message, count: rows.length },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: rows.length,
      saved_count: saved.data?.length || 0,
      videos: collected.slice(0, 100),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "PV5 유튜브 검색 실패" },
      { status: 500 }
    );
  }
}
