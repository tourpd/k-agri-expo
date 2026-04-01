// src/lib/expo/entry.ts
import { cookies } from "next/headers";

export type ExpoEntry = {
  name: string;
  phone: string;
  region?: string;
  crop?: string;
  role?: "farmer" | "buyer";
  ts?: number;
  v?: string;
};

const COOKIE_KEY = "kagri_expo_entry";

// ✅ base64url -> utf8 JSON (Edge/Node 공통)
function decodeBase64UrlToJson(b64url: string) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const b64p = b64 + pad;

  // Edge/브라우저
  if (typeof atob === "function") {
    const bin = atob(b64p);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  }

  // Node fallback
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Buffer } = require("node:buffer");
  const json = Buffer.from(b64p, "base64").toString("utf8");
  return JSON.parse(json);
}

function tryParseLegacy(raw: string) {
  // 예전 쿠키가 %7B...%7D(퍼센트 인코딩)로 들어온 케이스 구제
  try {
    const decoded = decodeURIComponent(raw);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function getExpoEntry(): Promise<ExpoEntry | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_KEY)?.value ?? null;
  if (!raw) return null;

  try {
    const parsed = decodeBase64UrlToJson(raw) as ExpoEntry;
    if (!parsed?.name || !parsed?.phone) return null;
    return parsed;
  } catch {
    const legacy = tryParseLegacy(raw) as ExpoEntry | null;
    if (!legacy?.name || !legacy?.phone) return null;
    return legacy;
  }
}

export async function hasExpoEntry(): Promise<boolean> {
  return !!(await getExpoEntry());
}

export function expoEntryCookieKey() {
  return COOKIE_KEY;
}