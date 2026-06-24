
import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {

  const id = req.nextUrl.searchParams.get("id");

  if (!id) {

    return NextResponse.json({ error: "job id가 필요합니다." }, { status: 400 });

  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase

    .from("knowledge_file_jobs")

    .select("*")

    .eq("id", id)

    .single();

  if (error) {

    return NextResponse.json({ error: error.message }, { status: 500 });

  }

  return NextResponse.json({ ok: true, job: data });

}

