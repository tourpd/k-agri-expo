import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: "admin vendor approve route is temporarily disabled",
    },
    { status: 503 }
  );
}
