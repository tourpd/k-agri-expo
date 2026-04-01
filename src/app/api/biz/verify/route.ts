import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  return NextResponse.json({
    ok: true,
    verified: false,
    skipped: true,
    message: "자동 검증은 현재 사용하지 않습니다. 업로드 정보 기준으로 진행합니다.",
    input: body ?? {},
  });
}