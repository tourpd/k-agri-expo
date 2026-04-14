import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ applicationId: string }>;
};

export async function POST(req: NextRequest, ctx: Params) {
  try {
    const { applicationId } = await ctx.params;

    if (!applicationId) {
      return NextResponse.json(
        { ok: false, success: false, error: "applicationId가 필요합니다." },
        { status: 400 }
      );
    }

    const origin = new URL(req.url).origin;

    const response = await fetch(
      `${origin}/api/admin/vendor-applications/${applicationId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: req.headers.get("cookie") || "",
        },
        body: JSON.stringify({
          action: "approve",
        }),
        cache: "no-store",
      }
    );

    const json = await response.json();

    return NextResponse.json(json, {
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "승인 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}