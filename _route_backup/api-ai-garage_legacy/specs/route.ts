import { NextResponse } from "next/server";
import { loadPV5Specs } from "@/lib/ai-garage/pv5-knowledge";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    specs: loadPV5Specs()
  });
}
