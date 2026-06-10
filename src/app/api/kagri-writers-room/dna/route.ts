import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ success: true, items: [] });
}
export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json({ success: true, item: { ...body, createdAt: new Date().toISOString() } });
}
