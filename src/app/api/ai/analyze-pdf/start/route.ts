import { NextResponse } from "next/server";
import { createPdfJob, runPdfJob } from "@/lib/ai/pdfJobEngine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "PDF 파일이 없습니다." },
      { status: 400 }
    );
  }

  const jobId = await createPdfJob(file);

  runPdfJob(jobId).catch((error) => {
    console.error("[PDF JOB ERROR]", error);
  });

  return NextResponse.json({
    ok: true,
    jobId,
    message: "PDF 분석 작업을 시작했습니다.",
  });
}
