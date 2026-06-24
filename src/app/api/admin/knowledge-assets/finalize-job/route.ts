import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function text(v: unknown) {
  return String(v ?? "").trim();
}

function shortText(v: unknown, max = 140) {
  const s = text(v).replace(/\s+/g, " ");
  return s.length > max ? s.slice(0, max) + "..." : s;
}

function getPageNo(row: any) {
  return Number(row.page_number ?? row.page_no ?? row.page ?? 0);
}

function getScore(row: any) {
  return Number(row.importance_score ?? 0);
}

function getBroadcastScore(row: any) {
  return Number(row.broadcast_score ?? row.importance_score ?? 0);
}

function getShortsScore(row: any) {
  return Number(row.shorts_score ?? row.importance_score ?? 0);
}

function getPageTitle(row: any) {
  return (
    text(row.title) ||
    text(row.topic) ||
    shortText(row.page_text ?? row.extracted_text ?? row.text_content ?? row.content, 40) ||
    `중요 페이지 ${getPageNo(row)}`
  );
}

function getPageBody(row: any) {
  return text(row.page_text ?? row.extracted_text ?? row.text_content ?? row.content ?? row.summary);
}

function makeBroadcastMaterial(row: any, job: any) {
  const pageNo = getPageNo(row);
  const title = getPageTitle(row);
  const body = getPageBody(row);

  return {
    job_id: job.id,
    file_id: job.file_id ?? null,
    page_number: pageNo || null,
    title: `[${job.original_filename ?? job.file_name ?? "자료"} p.${pageNo}] ${title}`,
    angle:
      text(row.broadcast_angle) ||
      text(row.angle) ||
      `${title}을 농민이 바로 이해하고 따라 할 수 있는 현장형 방송 아이템으로 구성`,
    key_message:
      text(row.key_message) ||
      shortText(body, 500) ||
      `${title} 관련 핵심 내용을 농민 행동지시 중심으로 정리`,
    importance_score: getScore(row),
    broadcast_score: getBroadcastScore(row),
    source_type: "ppt",
    status: "draft",
  };
}

function makeShortsMaterial(row: any, job: any) {
  const pageNo = getPageNo(row);
  const title = getPageTitle(row);
  const body = getPageBody(row);

  return {
    job_id: job.id,
    file_id: job.file_id ?? null,
    page_number: pageNo || null,
    hook:
      text(row.hook) ||
      `고추 농사에서 이걸 놓치면 손해봅니다`,
    title: `[p.${pageNo}] ${title}`,
    script_outline:
      text(row.script_outline) ||
      [
        `문제 제기: ${title}`,
        `핵심 설명: ${shortText(body, 220)}`,
        "농민 행동지시: 지금 농장에서 확인할 포인트를 짚어준다.",
        "마무리: 저장·방제·수확량·품질 개선과 연결한다.",
      ].join("\n"),
    importance_score: getScore(row),
    shorts_score: getShortsScore(row),
    source_type: "ppt",
    status: "draft",
  };
}

async function insertSafe(supabase: any, table: string, rows: any[]) {
  if (!rows.length) return { count: 0, error: null };

  const { error } = await supabase.from(table).insert(rows);

  if (!error) return { count: rows.length, error: null };

  console.error(`${table} insert error`, error);

  const safeRows = rows.map((row) => {
    if (table === "knowledge_broadcast_materials") {
      return {
        title: row.title,
        angle: row.angle,
        key_message: row.key_message,
      };
    }

    if (table === "knowledge_shorts_materials") {
      return {
        hook: row.hook,
        title: row.title,
        script_outline: row.script_outline,
      };
    }

    return row;
  });

  const retry = await supabase.from(table).insert(safeRows);

  if (retry.error) {
    console.error(`${table} retry insert error`, retry.error);
    return { count: 0, error: retry.error };
  }

  return { count: safeRows.length, error: null };
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseAdminClient();
    const body = await req.json().catch(() => ({}));

    const jobId = body.jobId || body.job_id || body.id;

    if (!jobId) {
      return NextResponse.json(
        { ok: false, error: "jobId가 필요합니다." },
        { status: 400 }
      );
    }

    const { data: job, error: jobError } = await supabase
      .from("knowledge_file_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { ok: false, error: "knowledge_file_jobs에서 job을 찾지 못했습니다.", detail: jobError },
        { status: 404 }
      );
    }

    const { data: pages, error: pageError } = await supabase
      .from("knowledge_page_index")
      .select("*")
      .eq("job_id", jobId)
      .order("importance_score", { ascending: false });

    if (pageError) {
      return NextResponse.json(
        { ok: false, error: "knowledge_page_index 조회 실패", detail: pageError },
        { status: 500 }
      );
    }

    const highValuePages = (pages ?? [])
      .filter((p: any) => getScore(p) >= 50 || getBroadcastScore(p) >= 50 || getShortsScore(p) >= 50)
      .slice(0, 50);

    const broadcastRows = highValuePages
      .filter((p: any) => getBroadcastScore(p) >= 50 || getScore(p) >= 60)
      .slice(0, 30)
      .map((p: any) => makeBroadcastMaterial(p, job));

    const shortsRows = highValuePages
      .filter((p: any) => getShortsScore(p) >= 50 || getScore(p) >= 60)
      .slice(0, 50)
      .map((p: any) => makeShortsMaterial(p, job));

    const broadcastResult = await insertSafe(
      supabase,
      "knowledge_broadcast_materials",
      broadcastRows
    );

    const shortsResult = await insertSafe(
      supabase,
      "knowledge_shorts_materials",
      shortsRows
    );

    await supabase
      .from("knowledge_file_jobs")
      .update({
        status: "finalized",
        finalized_at: new Date().toISOString(),
        high_value_pages_count: highValuePages.length,
        broadcast_inserted: broadcastResult.count,
        shorts_inserted: shortsResult.count,
      })
      .eq("id", jobId);

    return NextResponse.json({
      ok: true,
      job_id: jobId,
      high_value_pages: highValuePages.length,
      broadcast_inserted: broadcastResult.count,
      shorts_inserted: shortsResult.count,
      broadcast_error: broadcastResult.error,
      shorts_error: shortsResult.error,
    });
  } catch (e: any) {
    console.error("finalize-job fatal error", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
