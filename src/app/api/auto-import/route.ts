import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    return NextResponse.json({
      ok: true,
      success: true,
      message: "자동입점 API 준비 완료",
      received: body,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "자동입점 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    success: true,
    message: "auto-import route is working",
  });
}