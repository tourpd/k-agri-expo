import { NextResponse } from "next/server";
import { getPdfJob } from "@/lib/ai/pdfJobEngine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  try {
    const job = await getPdfJob(jobId);
    return NextResponse.json({ ok: true, job });
  } catch {
    return NextResponse.json(
      { ok: false, error: "작업을 찾을 수 없습니다." },
      { status: 404 }
    );
  }
}
