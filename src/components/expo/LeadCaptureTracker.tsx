"use client";

import { useEffect } from "react";

type Props = {
  boothId?: string | null;
  dealId?: string | null;
  landingType: "booth" | "deal" | "event" | "consult" | "unknown";
};

function getOrCreateSessionId() {
  const key = "expo_session_id";

  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;

    const created = `ses_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(key, created);
    return created;
  } catch {
    return `ses_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

function getQueryValue(name: string) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) ?? "";
}

export default function LeadCaptureTracker({
  boothId,
  dealId,
  landingType,
}: Props) {
  useEffect(() => {
    let cancelled = false;

    async function capture() {
      try {
        const source = getQueryValue("src") || "direct";
        const campaign = getQueryValue("campaign") || "";
        const video_code = getQueryValue("video") || "";
        const session_id = getOrCreateSessionId();

        // 같은 landing + same target은 1회만
        const dedupeKey = `lead_capture_done:${landingType}:${boothId || ""}:${dealId || ""}:${source}:${campaign}:${video_code}`;
        const already = window.sessionStorage.getItem(dedupeKey);
        if (already) return;

        const res = await fetch("/api/expo/lead", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            booth_id: boothId ?? null,
            deal_id: dealId ?? null,
            source,
            campaign: campaign || null,
            video_code: video_code || null,
            landing_type: landingType,
            session_id,
            message: `${landingType} landing visit`,
          }),
        });

        const data = await res.json();
        if (!cancelled && res.ok && data?.ok) {
          window.sessionStorage.setItem(dedupeKey, "1");
        }
      } catch (e) {
        console.error("LeadCaptureTracker error:", e);
      }
    }

    capture();

    return () => {
      cancelled = true;
    };
  }, [boothId, dealId, landingType]);

  return null;
}