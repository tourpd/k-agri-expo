import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const clientId = process.env.GMAIL_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { success: false, error: "GMAIL_CLIENT_ID가 없습니다." },
      { status: 500 }
    );
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  url.searchParams.set("client_id", clientId);
  url.searchParams.set(
    "redirect_uri",
    "http://localhost:3000/api/admin/gmail-auth/callback"
  );
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("scope", "https://www.googleapis.com/auth/gmail.readonly");

  return NextResponse.redirect(url.toString());
}