import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Body = {
  template_code?: string;
  to?: string;
  variables?: Record<string, string | number | null>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const template_code = typeof body.template_code === "string" ? body.template_code.trim() : "";
    const to = typeof body.to === "string" ? body.to.trim() : "";

    if (!template_code) {
      return NextResponse.json(
        { ok: false, error: "template_code is required." },
        { status: 400 }
      );
    }

    if (!to) {
      return NextResponse.json(
        { ok: false, error: "to is required." },
        { status: 400 }
      );
    }

    console.log("[KAKAO_DUMMY_NOTIFY]", {
      template_code,
      to,
      variables: body.variables ?? {},
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      mode: "dummy",
      template_code,
      to,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "dummy kakao notify failed" },
      { status: 500 }
    );
  }
}