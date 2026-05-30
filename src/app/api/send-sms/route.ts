import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safe(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const to = safe(body.to);
    const message = safe(body.message);

    if (!to) {
      return NextResponse.json(
        { ok: false, error: "수신 전화번호가 없습니다." },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { ok: false, error: "문자 내용이 없습니다." },
        { status: 400 }
      );
    }

    console.log("====================================");
    console.log("📩 [임시 문자 발송]");
    console.log("수신번호:", to);
    console.log("내용:");
    console.log(message);
    console.log("====================================");

    return NextResponse.json({
      ok: true,
      mode: "mock",
      message: "문자업체 연동 전이라 실제 발송은 하지 않고 서버 로그에 기록했습니다.",
      to,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "문자 발송 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}