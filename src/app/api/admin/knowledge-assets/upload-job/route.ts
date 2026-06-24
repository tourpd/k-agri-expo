
import { NextRequest, NextResponse } from "next/server";

import { mkdir, writeFile } from "fs/promises";

import path from "path";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

function safeFileName(name: string) {

  return name.replace(/[^a-zA-Z0-9가-힣._() -]/g, "_").slice(0, 160);

}

export async function POST(req: NextRequest) {

  try {

    const form = await req.formData();

    const file = form.get("file");

    if (!(file instanceof File)) {

      return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });

    }

    const supabase = createSupabaseAdminClient();

    const originalName = safeFileName(file.name);

    const fileType = originalName.split(".").pop()?.toLowerCase() || "unknown";

    const buffer = Buffer.from(await file.arrayBuffer());

    const { data: job, error } = await supabase

      .from("knowledge_file_jobs")

      .insert({

        file_name: originalName,

        file_type: fileType,

        file_size: buffer.length,

        status: "uploaded",

        stage: "파일 업로드 완료",

        progress: 5,

      })

      .select("*")

      .single();

    if (error || !job) {

      return NextResponse.json({ error: error?.message || "job 생성 실패" }, { status: 500 });

    }

    const dir = path.join(process.cwd(), "public", "uploads", "knowledge-source", job.id);

    await mkdir(dir, { recursive: true });

    const sourcePath = path.join(dir, originalName);

    await writeFile(sourcePath, buffer);

    const publicPath = `/uploads/knowledge-source/${job.id}/${originalName}`;

    await supabase

      .from("knowledge_file_jobs")

      .update({

        source_path: publicPath,

        stage: "서버 저장 완료",

        progress: 10,

      })

      .eq("id", job.id);

    return NextResponse.json({

      ok: true,

      job_id: job.id,

      file_name: originalName,

      source_path: publicPath,

    });

  } catch (e: any) {

    return NextResponse.json(

      { error: e?.message || "업로드 job 생성 실패" },

      { status: 500 }

    );

  }

}

