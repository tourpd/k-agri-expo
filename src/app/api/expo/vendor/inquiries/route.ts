import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    inquiries: [],
  });
}

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: "expo vendor inquiries route is temporarily disabled",
    },
    { status: 503 }
  );
}
