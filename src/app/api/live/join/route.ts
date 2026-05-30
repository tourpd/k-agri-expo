import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendAligoSms } from "@/lib/sms/aligo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: unknown) {
  return String(v || "").trim();
}

function normalizePhone(v: unknown) {
  const d = String(v || "").replace(/\D/g, "").slice(0, 11);
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return String(v || "").trim();
}

function pad(n: number) {
  return String(n || 0).padStart(4, "0");
}

async function getCurrentEvent(
  supabase: ReturnType<typeof createSupabaseAdminClient>
) {
  const live = await supabase
    .from("live_events")
    .select("*")
    .eq("status", "live")
    .order("locked_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (live.data) return live.data;

  const ready = await supabase
    .from("live_events")
    .select("*")
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return ready.data;
}

async function sendJoinSmsSafe({
  phone,
  name,
  drawNumber,
  eventTitle,
}: {
  phone: string;
  name: string;
  drawNumber: number;
  eventTitle: string;
}) {
  try {
    return await sendAligoSms({
      to: phone,
      message: `[한국농수산TV]
${name}님 라이브 경품 참여 완료!
이벤트: ${eventTitle}
참여번호: ${pad(drawNumber)}

방송 중 이 번호가 나오면 당첨입니다.`,
    });
  } catch (e) {
    console.error("[LIVE JOIN SMS ERROR]", e);
    return { ok: false, error: e instanceof Error ? e.message : "sms error" };
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseAdminClient();
    const body = await req.json();

    const name = clean(body.name);
    const phone = normalizePhone(body.phone);
    const region = clean(body.region);
    const crop = clean(body.crop);
    const farm_size = clean(body.farm_size);

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "이름을 입력해주세요." },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { ok: false, error: "전화번호를 입력해주세요." },
        { status: 400 }
      );
    }

    const event = await getCurrentEvent(supabase);

    if (!event?.id) {
      return NextResponse.json(
        { ok: false, error: "현재 운영 중인 이벤트가 없습니다." },
        { status: 400 }
      );
    }

    const liveId = event.id;

    const existing = await supabase
      .from("live_participants")
      .select("*")
      .eq("live_id", liveId)
      .eq("phone", phone)
      .maybeSingle();

    if (existing.error) {
      console.error("[LIVE JOIN EXISTING ERROR]", existing.error);
      return NextResponse.json(
        { ok: false, error: existing.error.message },
        { status: 500 }
      );
    }

    if (existing.data) {
      await sendJoinSmsSafe({
        phone,
        name: existing.data.name || name,
        drawNumber: Number(existing.data.draw_number || 0),
        eventTitle: event.title || "K-Agri LIVE",
      });

      return NextResponse.json({
        ok: true,
        duplicate: true,
        message: "이미 참여한 전화번호입니다. 기존 참여번호를 다시 안내했습니다.",
        event,
        live_id: liveId,
        participant: existing.data,
        draw_number: existing.data.draw_number,
      });
    }

    let inserted: any = null;
    let lastError: any = null;

    for (let i = 0; i < 5; i += 1) {
      const maxRow = await supabase
        .from("live_participants")
        .select("draw_number")
        .eq("live_id", liveId)
        .not("draw_number", "is", null)
        .order("draw_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (maxRow.error) {
        lastError = maxRow.error;
        console.error("[LIVE JOIN MAX DRAW ERROR]", maxRow.error);
        break;
      }

      const nextNumber = Number(maxRow.data?.draw_number || 0) + 1 + i;

      const result = await supabase
        .from("live_participants")
        .insert({
          live_id: liveId,

          name,
          phone,
          region,
          crop,
          farm_size,

          draw_number: nextNumber,

          is_eligible: true,
          is_drawn: false,
          confirmed_winner: false,
          call_status: "not_called",
        })
        .select("*")
        .single();

      if (!result.error && result.data) {
        inserted = result.data;
        break;
      }

      lastError = result.error;
    }

    if (!inserted) {
      return NextResponse.json(
        {
          ok: false,
          error: lastError?.message || "참여번호 생성에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    const smsResult = await sendJoinSmsSafe({
      phone,
      name,
      drawNumber: Number(inserted.draw_number),
      eventTitle: event.title || "K-Agri LIVE",
    });

    return NextResponse.json({
      ok: true,
      event,
      live_id: liveId,
      participant: inserted,
      draw_number: inserted.draw_number,
      sms: smsResult,
      message: "참여가 완료되었습니다.",
    });
  } catch (e) {
    console.error("[LIVE JOIN ERROR]", e);

    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "server error",
      },
      { status: 500 }
    );
  }
}