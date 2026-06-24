import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

function publicUrlFromPath(absPath: string) {
  const publicRoot = path.join(process.cwd(), "public");
  return absPath.replace(publicRoot, "").replaceAll(path.sep, "/");
}

async function exists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseAdminClient();
    const body = await req.json().catch(() => ({}));
    const jobId = body.jobId || body.job_id;

    if (!jobId) {
      return NextResponse.json({ ok: false, error: "jobId 필요" }, { status: 400 });
    }

    const { data: job, error: jobError } = await supabase
      .from("knowledge_file_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ ok: false, error: "job 없음", detail: jobError }, { status: 404 });
    }

    const pdfPath = job.pdf_path;
    if (!pdfPath || !(await exists(pdfPath))) {
      return NextResponse.json({ ok: false, error: "pdf_path 없음 또는 파일 없음", pdfPath }, { status: 400 });
    }

    const outDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "knowledge-pages",
      jobId
    );

    await fs.mkdir(outDir, { recursive: true });

    const prefix = path.join(outDir, "page");

    await execFileAsync("pdftoppm", [
      "-png",
      "-r",
      "140",
      pdfPath,
      prefix,
    ]);

    const files = (await fs.readdir(outDir))
      .filter((f) => f.startsWith("page-") && f.endsWith(".png"))
      .sort();

    let updated = 0;

    for (const file of files) {
      const m = file.match(/page-(\d+)\.png$/);
      if (!m) continue;

      const pageNumber = Number(m[1]);
      const abs = path.join(outDir, file);
      const url = publicUrlFromPath(abs);

      const { error } = await supabase
        .from("knowledge_page_index")
        .update({
          thumbnail_url: url,
          full_image_url: url,
          image_analysis_status: "image_linked",
        })
        .eq("job_id", jobId)
        .eq("page_number", pageNumber);

      if (!error) updated++;
    }

    return NextResponse.json({
      ok: true,
      job_id: jobId,
      images_created: files.length,
      rows_updated: updated,
      out_dir: `/uploads/knowledge-pages/${jobId}`,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
