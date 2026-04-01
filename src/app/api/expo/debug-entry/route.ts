// src/app/api/expo/debug-entry/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const KEY = "kagri_expo_entry";

function safeDecode(v: string) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export async function GET() {
  // ✅ Next 최신 동작: cookies()가 Promise일 수 있으므로 await
  const cookieStore = await cookies();

  const raw = cookieStore.get(KEY)?.value ?? null;
  const decoded = raw ? safeDecode(raw) : null;

  let parsed: any = null;
  let parseOk = false;
  let parseErr: string | null = null;

  if (decoded) {
    try {
      parsed = JSON.parse(decoded);
      parseOk = !!(parsed?.name && parsed?.phone);
    } catch (e: any) {
      parseErr = e?.message ?? "JSON.parse failed";
    }
  }

  return NextResponse.json({
    key: KEY,
    hasCookie: !!raw,
    rawPreview: raw ? raw.slice(0, 120) : null,
    decodedPreview: decoded ? decoded.slice(0, 120) : null,
    parseOk,
    parseErr,
    parsed,
  });
}