import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function yt(path: string) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY가 .env.local에 없습니다.");

  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`https://www.googleapis.com/youtube/v3/${path}${sep}key=${key}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube API 오류: ${text}`);
  }

  return res.json();
}

function isoDurationToText(v?: string) {
  if (!v) return "";
  const m = v.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return v;
  const h = Number(m[1] || 0);
  const min = Number(m[2] || 0);
  const s = Number(m[3] || 0);
  return h ? `${h}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${min}:${String(s).padStart(2, "0")}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const channelId = String(body.channelId || "").trim();

    if (!channelId) {
      return NextResponse.json({ error: "channelId가 필요합니다." }, { status: 400 });
    }

    const channel = await yt(`channels?part=contentDetails&id=${channelId}`);
    const uploads = channel.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploads) {
      return NextResponse.json({ error: "업로드 재생목록을 찾지 못했습니다." }, { status: 400 });
    }

    let pageToken = "";
    const allVideoIds: string[] = [];

    for (let i = 0; i < 50; i++) {
      const json = await yt(
        `playlistItems?part=contentDetails&playlistId=${uploads}&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ""}`
      );

      for (const item of json.items || []) {
        const id = item.contentDetails?.videoId;
        if (id) allVideoIds.push(id);
      }

      pageToken = json.nextPageToken || "";
      if (!pageToken) break;
    }

    const rows: any[] = [];

    for (let i = 0; i < allVideoIds.length; i += 50) {
      const ids = allVideoIds.slice(i, i + 50).join(",");
      const json = await yt(`videos?part=snippet,contentDetails,statistics&id=${ids}`);

      for (const v of json.items || []) {
        const sn = v.snippet || {};
        const st = v.statistics || {};
        const th = sn.thumbnails?.maxres?.url || sn.thumbnails?.high?.url || sn.thumbnails?.medium?.url || "";

        rows.push({
          youtube_video_id: v.id,
          title: sn.title || "",
          description: sn.description || "",
          thumbnail_url: th,
          published_at: sn.publishedAt || null,
          channel_title: sn.channelTitle || "한국농수산TV",
          video_url: `https://www.youtube.com/watch?v=${v.id}`,
          duration: isoDurationToText(v.contentDetails?.duration),
          view_count: Number(st.viewCount || 0),
          like_count: Number(st.likeCount || 0),
          comment_count: Number(st.commentCount || 0),
          updated_at: new Date().toISOString(),
        });
      }
    }

    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from("youtube_content_assets")
      .upsert(rows, { onConflict: "youtube_video_id" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, count: rows.length });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "유튜브 영상 DB화 실패" },
      { status: 500 }
    );
  }
}
