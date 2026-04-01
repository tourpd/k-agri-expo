import type { HomeSlot } from "@/types/expo-home";

export function safeText(v: unknown, fallback: string) {
  const s = typeof v === "string" ? v : "";
  return s.trim() ? s : fallback;
}

export function resolveLink(linkType?: string | null, linkValue?: string | null) {
  const type = safeText(linkType, "custom");
  const value = safeText(linkValue, "");

  switch (type) {
    case "booth":
      return value ? `/expo/booths/${value}` : "/expo/booths";
    case "hall":
      return value ? `/expo/hall/${value}` : "/expo";
    case "event":
      return value || "/expo/event";
    case "live":
      return value || "/expo/live";
    case "external":
      return value || "/expo";
    case "custom":
    default:
      return value || "/expo";
  }
}

export function isExternalLink(linkType?: string | null, linkValue?: string | null) {
  return safeText(linkType, "") === "external" && !!safeText(linkValue, "");
}

export function groupSlots(slots: HomeSlot[]) {
  const grouped: Record<string, HomeSlot[]> = {};

  for (const slot of slots) {
    if (!slot.is_active) continue;
    if (!grouped[slot.section_key]) grouped[slot.section_key] = [];
    grouped[slot.section_key].push(slot);
  }

  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => (a.slot_order ?? 0) - (b.slot_order ?? 0));
  }

  return grouped;
}

export function toEmbedUrl(url?: string | null) {
  const value = safeText(url, "");
  if (!value) return "";

  if (value.includes("/embed/")) return value;

  const watchMatch = value.match(/[?&]v=([^&]+)/);
  if (watchMatch?.[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  const shortMatch = value.match(/youtu\.be\/([^?&/]+)/);
  if (shortMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  return "";
}