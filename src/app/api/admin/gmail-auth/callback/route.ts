import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { success: false, error: "code가 없습니다." },
        { status: 400 }
      );
    }

    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: "Gmail OAuth 환경변수가 없습니다." },
        { status: 500 }
      );
    }

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: "http://localhost:3000/api/admin/gmail-auth/callback",
        grant_type: "authorization_code",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: ".env.local에 refresh_token을 넣으세요.",
      refresh_token: data.refresh_token,
      access_token_preview: String(data.access_token || "").slice(0, 20),
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Gmail 인증 실패" },
      { status: 500 }
    );
  }
}