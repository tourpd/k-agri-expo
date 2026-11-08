import "server-only";

import media from "@/data/problem-media.json";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getProblem, type Problem } from "./catalog";

/**
 * 문제 페이지 덧씌우기 (코드 목록 < problem-media.json < DB expo_problems)
 *
 * - 기본 내용은 catalog.ts 에 있고, 영상 시작 지점·현장 사진처럼 '나중에 채우는 값'만 여기서 덮어씁니다.
 * - DB 표가 아직 없거나 비어 있거나 연결이 안 되면 조용히 건너뛰고 코드 목록 그대로 보여줍니다.
 * - 영상 시작 지점은 실제로 영상을 보고 확인한 값만 넣습니다. 추측해서 넣지 않습니다.
 */

type MediaPatch = Partial<Pick<Problem, "videoUrl" | "videoStart" | "videoTitle" | "videoSource" | "imageUrls">>;

const FILE_MEDIA = media as Record<string, MediaPatch>;

function cleanUrls(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const urls = v.filter((x): x is string => typeof x === "string" && /^https?:\/\//.test(x.trim())).map((x) => x.trim());
  return urls.length ? urls : undefined;
}

function cleanStart(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isInteger(n) && n > 0 && n < 6 * 3600 ? n : undefined;
}

function cleanText(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function patchFrom(src: Record<string, unknown> | null | undefined): MediaPatch {
  if (!src) return {};
  const out: MediaPatch = {};
  const url = cleanText(src.videoUrl ?? src.video_url);
  if (url && /^https?:\/\//.test(url)) out.videoUrl = url;
  const start = cleanStart(src.videoStart ?? src.video_start);
  if (start) out.videoStart = start;
  const title = cleanText(src.videoTitle ?? src.video_title);
  if (title) out.videoTitle = title;
  const source = cleanText(src.videoSource ?? src.video_source);
  if (source === "kaftv" || source === "dof") out.videoSource = source;
  const images = cleanUrls(src.imageUrls ?? src.image_urls);
  if (images) out.imageUrls = images;
  return out;
}

async function dbPatch(slug: string): Promise<MediaPatch> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("expo_problems")
      .select("video_url, video_start, video_title, video_source, image_urls")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error || !data) return {};
    return patchFrom(data as Record<string, unknown>);
  } catch {
    // 표가 아직 없거나 환경변수가 없으면 코드 목록으로 충분합니다.
    return {};
  }
}

/** 문제 + 영상·사진 덧씌움. 없으면 null */
export async function getProblemWithOverrides(slug: string): Promise<Problem | null> {
  const base = getProblem(slug);
  if (!base) return null;
  const merged: Problem = { ...base, ...patchFrom(FILE_MEDIA[slug] as Record<string, unknown>), ...(await dbPatch(slug)) };
  // 영상 주소가 바뀌었는데 시작 지점만 옛 영상 것이 남는 일을 막습니다.
  if (merged.videoUrl !== base.videoUrl && merged.videoStart === base.videoStart) {
    merged.videoStart = undefined;
  }
  return merged;
}
