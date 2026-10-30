import { NextResponse } from "next/server";
import { problemForDiagnosis } from "@/lib/problems/diagnosis";

/**
 * 포토닥터 → 약박사 처방 입구
 *   /dx?crop=토마토&dx=칼슘 결핍&prob=60&src=photodoctor
 * 맞는 문제 페이지(지금 할 일·자재·약박사)로 보냅니다. 못 찾으면 약박사 검색으로.
 */
export function GET(req: Request) {
  const url = new URL(req.url);
  const crop = url.searchParams.get("crop") ?? "";
  const dx = url.searchParams.get("dx") ?? "";
  const obs = url.searchParams.get("obs") ?? "";
  const prob = url.searchParams.get("prob") ?? "";
  const src = url.searchParams.get("src") ?? "photodoctor";
  const hit = problemForDiagnosis({ crop, dx, obs });

  const to = new URL(url.origin);
  if (hit) {
    to.pathname = `/p/${hit.slug}`;
    to.searchParams.set("src", src);
    if (dx) to.searchParams.set("dx", dx.slice(0, 40));
    if (prob) to.searchParams.set("prob", prob.replace(/\D/g, "").slice(0, 2));
  } else {
    to.pathname = "/yakbaksa";
    if (dx) to.searchParams.set("q", dx.replace(/(병|결핍|피해|해충)$/g, "").slice(0, 20));
  }
  return NextResponse.redirect(to, 302);
}
