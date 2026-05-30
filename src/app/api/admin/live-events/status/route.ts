import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUS = ["ready", "live", "ended"] as const;
type EventStatus = (typeof VALID_STATUS)[number];

function isValidStatus(v: string): v is EventStatus {
  return VALID_STATUS.includes(v as EventStatus);
}

export async function PATCH(req: Request) {
  const supabase = createSupabaseAdminClient();

  try {
    const body = await req.json();

    const id = String(body.id || "").trim();
    const status = String(body.status || "").trim();

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "event id가 없습니다." },
        { status: 400 }
      );
    }

    if (!isValidStatus(status)) {
      return NextResponse.json(
        { ok: false, error: "잘못된 이벤트 상태입니다." },
        { status: 400 }
      );
    }

    const { data: currentEvent, error: readError } = await supabase
      .from("live_events")
      .select("id,status,locked_at,ended_at")
      .eq("id", id)
      .maybeSingle();

    if (readError) {
      return NextResponse.json(
        { ok: false, error: readError.message },
        { status: 500 }
      );
    }

    if (!currentEvent) {
      return NextResponse.json(
        { ok: false, error: "이벤트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (currentEvent.status === "ended" && status !== "ended") {
      return NextResponse.json(
        {
          ok: false,
          error: "이미 종료된 이벤트는 다시 준비중/방송중으로 되돌릴 수 없습니다.",
        },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    const patch: Record<string, unknown> = {
      status,
    };

    if (status === "ready") {
      patch.locked_at = null;
      patch.ended_at = null;
    }

    if (status === "live") {
      patch.locked_at = currentEvent.locked_at || now;
      patch.ended_at = null;
    }

    if (status === "ended") {
      patch.ended_at = currentEvent.ended_at || now;
    }

    const { data, error } = await supabase
      .from("live_events")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      event: data,
      message:
        status === "ready"
          ? "이벤트가 준비중 상태로 변경되었습니다."
          : status === "live"
          ? "이벤트가 방송중 상태로 변경되었습니다."
          : "이벤트가 종료되었습니다.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "상태 변경 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}