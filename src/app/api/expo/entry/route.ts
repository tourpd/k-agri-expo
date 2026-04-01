// src/app/api/expo/entry/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function pickRole(v: any) {
  return v === "buyer" ? "buyer" : "farmer";
}
function normalizePhone(v: any) {
  return String(v ?? "").replace(/\D/g, "");
}

// ✅ Node/Edge 공통 base64url 인코딩 (Buffer 의존 제거)
function toB64Url(obj: any) {
  const json = JSON.stringify(obj);

  // 브라우저/Edge
  if (typeof btoa === "function") {
    const bytes = new TextEncoder().encode(json);
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    const b64 = btoa(bin);
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  // Node fallback
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Buffer } = require("node:buffer");
  return Buffer.from(json, "utf8").toString("base64url");
}

export async function POST(req: Request) {
  const fd = await req.formData();

  const role = pickRole(fd.get("role"));
  const name = String(fd.get("name") ?? "").trim();
  const phone = normalizePhone(fd.get("phone")).trim();
  const region = String(fd.get("region") ?? "").trim();
  const crop = String(fd.get("crop") ?? "").trim();

  if (!name || !phone) {
    return NextResponse.redirect(new URL("/expo/entry", req.url), 303);
  }

  const entry = { role, name, phone, region, crop, ts: Date.now(), v: "entry_cookie_v3" };

  const res = NextResponse.redirect(new URL("/expo/hall/agri-inputs", req.url), 303);

  res.cookies.set({
    name: "kagri_expo_entry",
    value: toB64Url(entry),
    httpOnly: true,
    sameSite: "lax",
    secure: false, // https 배포면 true
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  // 혹시 모를 캐시 간섭 차단
  res.headers.set("Cache-Control", "no-store");

  return res;
}