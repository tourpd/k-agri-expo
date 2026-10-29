import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const rawFfmpegPath = typeof ffmpegStatic === "string" ? ffmpegStatic : "";
const fixedFfmpegPath = rawFfmpegPath.startsWith("/ROOT/")
  ? rawFfmpegPath.replace("/ROOT", process.cwd())
  : rawFfmpegPath;

if (fixedFfmpegPath) ffmpeg.setFfmpegPath(fixedFfmpegPath);

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function extractYoutubeId(url: string) {
  const v = safe(url);
  if (!v) return "";
  if (v.includes("youtu.be/")) return v.split("youtu.be/")[1]?.split("?")[0] || "";
  if (v.includes("youtube.com/shorts/")) return v.split("youtube.com/shorts/")[1]?.split("?")[0] || "";
  if (v.includes("youtube.com/watch")) {
    try {
      return new URL(v).searchParams.get("v") || "";
    } catch {
      return "";
    }
  }
  return "";
}

async function fetchYoutubeMeta(videoUrl: string) {
  const videoId = extractYoutubeId(videoUrl);

  const meta = {
    video_id: videoId,
    title: "",
    channel: "",
    description: "",
    thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "",
    published_at: "",
    view_count: "",
  };

  if (!videoId) return meta;

  const key = process.env.YOUTUBE_API_KEY;

  if (key) {
    const apiUrl =
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${key}`;

    const res = await fetch(apiUrl, { cache: "no-store" });
    const data = await res.json();

    const item = data?.items?.[0];
    const snippet = item?.snippet || {};
    const stats = item?.statistics || {};

    meta.title = safe(snippet.title);
    meta.channel = safe(snippet.channelTitle);
    meta.description = safe(snippet.description);
    meta.published_at = safe(snippet.publishedAt);
    meta.view_count = safe(stats.viewCount);
    meta.thumbnail =
      safe(snippet.thumbnails?.high?.url) ||
      safe(snippet.thumbnails?.medium?.url) ||
      meta.thumbnail;
  } else {
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        meta.title = safe(data.title);
        meta.channel = safe(data.author_name);
        meta.thumbnail = safe(data.thumbnail_url) || meta.thumbnail;
      }
    } catch {}
  }

  return meta;
}

function extractJson(text: string) {
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("JSON 응답을 찾지 못했습니다.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function convertToMp3(inputPath: string, outputPath: string) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec("libmp3lame")
      .audioBitrate("128k")
      .format("mp3")
      .on("end", () => resolve())
      .on("error", reject)
      .save(outputPath);
  });
}

async function transcribeMp3(apiKey: string, mp3Path: string) {
  const mp3Buffer = await fs.readFile(mp3Path);
  const audioFile = new File([mp3Buffer], "pv5-video.mp3", { type: "audio/mpeg" });

  const audioForm = new FormData();
  audioForm.append("file", audioFile);
  audioForm.append("model", process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1");
  audioForm.append("language", "ko");
  audioForm.append("response_format", "json");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: audioForm,
  });

  return { ok: res.ok, data: await res.json() };
}

export async function POST(req: Request) {
  let tmpDir = "";

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "OPENAI_API_KEY가 없습니다." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const videoUrl = safe(formData.get("video_url"));
    const memo = safe(formData.get("memo"));

    if (!videoUrl && !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "유튜브 URL 또는 영상/음성 파일이 필요합니다." },
        { status: 400 }
      );
    }

    const youtubeMeta = await fetchYoutubeMeta(videoUrl);

    let transcript = "";

    if (file instanceof File) {
      if (!fixedFfmpegPath) {
        return NextResponse.json(
          { success: false, error: "ffmpeg 실행 파일 경로를 찾지 못했습니다." },
          { status: 500 }
        );
      }

      tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pv5-video-"));
      const inputPath = path.join(tmpDir, "input");
      const outputPath = path.join(tmpDir, "output.mp3");

      await fs.writeFile(inputPath, Buffer.from(await file.arrayBuffer()));
      await convertToMp3(inputPath, outputPath);

      const transcribe = await transcribeMp3(apiKey, outputPath);

      if (!transcribe.ok) {
        return NextResponse.json(
          {
            success: false,
            error: transcribe.data?.error?.message || "음성 텍스트 변환 실패",
          },
          { status: 500 }
        );
      }

      transcript = safe(transcribe.data.text);
    }

    if (!youtubeMeta.title && !youtubeMeta.description && !memo && !transcript) {
      return NextResponse.json(
        { success: false, error: "유튜브 제목/설명 또는 메모/전사 내용이 없습니다." },
        { status: 400 }
      );
    }

    const prompt = `
너는 대한민국 최고의 PV5 공간설계 분석가이자 캠핑카 빌더 분석가다.

절대 규칙:
- 추정 금지
- 유튜브 제목, 설명, 전사 내용, 사용자 메모에 실제 나온 것만 confirmed로 기록
- 가격은 실제로 나온 금액만 기록
- 안 나온 정보는 빈 문자열 또는 빈 배열로 둔다
- 반드시 JSON만 출력한다

영상 URL:
${videoUrl || "-"}

유튜브 제목:
${youtubeMeta.title || "-"}

유튜브 채널:
${youtubeMeta.channel || "-"}

유튜브 설명:
${youtubeMeta.description || "-"}

업로드일:
${youtubeMeta.published_at || "-"}

조회수:
${youtubeMeta.view_count || "-"}

사용자 메모:
${memo || "-"}

전사 내용:
${transcript || "-"}

반드시 아래 JSON 형식으로만 출력하라.

{
  "summary": "",
  "builder": {
    "name": "",
    "location": "",
    "contact": "",
    "source_confirmed": true
  },
  "vehicle": {
    "model": "",
    "type": "Cargo | Passenger | Unknown",
    "confirmed_features": []
  },
  "main_category": "",
  "sub_category": "",
  "confirmed_costs": [
    {
      "item": "",
      "price_krw": 0,
      "included": "",
      "source": ""
    }
  ],
  "products": [],
  "space_layout": [],
  "electrical": [],
  "furniture": [],
  "human_activity": [],
  "target_customer": [],
  "design_rules": [],
  "cost_meaning": "",
  "writer_room_notes": "",
  "business_notes": "",
  "developer_notes": "",
  "content_notes": "",
  "warnings": []
}
`;

    const aiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model:
          process.env.OPENAI_PV5_ANALYSIS_MODEL ||
          process.env.OPENAI_CRM_MODEL ||
          "gpt-4.1-mini",
        input: prompt,
        store: false,
      }),
    });

    const aiData = await aiRes.json();

    if (!aiRes.ok) {
      return NextResponse.json(
        { success: false, error: aiData?.error?.message || "OpenAI 분석 실패" },
        { status: 500 }
      );
    }

    const outputText =
      aiData?.output_text ||
      aiData?.output?.[0]?.content?.[0]?.text ||
      "";

    const parsed = extractJson(outputText);

    const insertPayload = {
      video_url: videoUrl,
      video_title: youtubeMeta.title,
      source_channel: youtubeMeta.channel,

      builder_name: safe(parsed.builder?.name),
      builder_region: safe(parsed.builder?.location),
      builder_contact: safe(parsed.builder?.contact),

      vehicle_type: safe(parsed.vehicle?.type),
      vehicle_model: safe(parsed.vehicle?.model),

      main_category: safe(parsed.main_category),
      sub_category: safe(parsed.sub_category),

      summary: safe(parsed.summary),
      target_customer: JSON.stringify(parsed.target_customer || []),

      confirmed_costs: parsed.confirmed_costs || [],
      products: parsed.products || [],
      space_layout: parsed.space_layout || [],
      electrical: parsed.electrical || [],
      furniture: parsed.furniture || [],
      human_activity: parsed.human_activity || [],
      design_rules: parsed.design_rules || [],

      cost_meaning: safe(parsed.cost_meaning),
      writer_room_notes: safe(parsed.writer_room_notes),
      business_notes: safe(parsed.business_notes),
      developer_notes: safe(parsed.developer_notes),
      content_notes: safe(parsed.content_notes),

      transcript,
      raw_analysis: {
        youtube_meta: youtubeMeta,
        analysis: parsed,
      },

      status: "draft",
    };

    const saved = await supabase
      .from("pv5_video_analysis")
      .insert(insertPayload)
      .select("id")
      .single();

    if (saved.error) {
      return NextResponse.json({
        success: true,
        saved: false,
        save_error: saved.error.message,
        youtube_meta: youtubeMeta,
        transcript,
        ...parsed,
      });
    }

    return NextResponse.json({
      success: true,
      saved: true,
      db_id: saved.data?.id,
      youtube_meta: youtubeMeta,
      transcript,
      ...parsed,
    });
  } catch (error: any) {
    console.error("[pv5/analyze-video] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "PV5 영상 분석 실패" },
      { status: 500 }
    );
  } finally {
    try {
      if (tmpDir) await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}
