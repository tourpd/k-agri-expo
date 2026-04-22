import type { BoothShape } from "../types";
import { safe } from "./format";

export function boolOn(v: boolean | undefined, defaultValue = true) {
  return typeof v === "boolean" ? v : defaultValue;
}

export function normalizeHallId(v?: string) {
  const hall = safe(v, "");
  if (!hall) return "";
  if (hall === "agri_inputs") return "agri-inputs";
  if (hall === "smart_farm") return "smartfarm";
  if (hall === "eco_friendly") return "eco-friendly";
  if (hall === "future_insect") return "future-insect";
  return hall;
}

export function normalizeSlotCode(v?: string) {
  const slot = safe(v, "");
  if (!slot) return "-";
  const raw = slot.toUpperCase().replace(/\s+/g, "");
  const m = raw.match(/^([A-Z])[-_]?0*([0-9]+)$/);
  if (!m) return raw;
  return `${m[1]}-${m[2].padStart(2, "0")}`;
}

export function hallLabel(v?: string) {
  const hall = normalizeHallId(v);
  if (!hall) return "-";
  if (hall === "agri-inputs") return "농자재관";
  if (hall === "machines" || hall === "agri-machinery") return "농기계관";
  if (hall === "seeds") return "종자관";
  if (hall === "smartfarm") return "스마트팜관";
  if (hall === "eco-friendly" || hall === "eco") return "친환경관";
  if (hall === "future-insect" || hall === "future-food") return "미래식량관";
  return hall;
}

export function boothImage(booth: BoothShape) {
  return (
    safe(booth.cover_image_url, "") ||
    safe(booth.banner_url, "") ||
    safe(booth.thumbnail_url, "") ||
    safe(booth.logo_url, "")
  );
}

export function getYoutubeValue(booth: BoothShape) {
  return (
    safe(booth.youtube_url, "") ||
    safe(booth.video_url, "") ||
    safe(booth.youtube_link, "")
  );
}

export function buildPublicBoothHref(boothId: string) {
  return boothId ? `/expo/booths/${encodeURIComponent(boothId)}` : "";
}

export function boothStatusLabel(booth: BoothShape) {
  if (
    booth.is_public === true &&
    booth.is_active === true &&
    booth.is_published === true
  ) {
    return "공개 중";
  }
  if (booth.is_public !== true) return "비공개";
  return "준비 중";
}

export function planInfo(planType?: string) {
  const plan = safe(planType, "free").toLowerCase();
  if (plan === "premium") {
    return { label: "premium", labelKo: "프리미엄", limit: 10 };
  }
  if (plan === "basic") {
    return { label: "basic", labelKo: "기본", limit: 3 };
  }
  return { label: "free", labelKo: "무료", limit: 1 };
}