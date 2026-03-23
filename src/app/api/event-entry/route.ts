import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { formatEntryCode } from "@/lib/entryCode";

export const dynamic = "force-dynamic";

type Body = {
  name?: string | null;
  phone?: string;
};

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const name = clean(body.name) || null;
    const phone = clean(body.phone);

    if (!phone) {
      return NextResponse.json(
        { ok: false, error: "phone is required." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // 1) 이미 참여한 번호 조회
    const { data: existing, error: existingError } = await supabase
      .from("event_entries")
      .select("id, name, phone, entry_no, entry_code, created_at")
      .eq("phone", phone)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { ok: false, error: existingError.message },
        { status: 500 }
      );
    }

    // 2) 이미 참가번호까지 있으면 그대로 반환
    if (existing?.entry_code) {
      return NextResponse.json({
        ok: true,
        duplicated: true,
        entry: existing,
      });
    }

    // 3) 기존 row는 있는데 entry_code만 없다면 복구 생성
    if (existing && existing.entry_no) {
      const recoveredEntryCode = formatEntryCode(existing.entry_no);

      const { data: recovered, error: recoverError } = await supabase
        .from("event_entries")
        .update({
          entry_code: recoveredEntryCode,
          name: name ?? existing.name ?? null,
        })
        .eq("id", existing.id)
        .select("id, name, phone, entry_no, entry_code, created_at")
        .single();

      if (recoverError) {
        return NextResponse.json(
          { ok: false, error: recoverError.message },
          { status: 500 }
        );
      }

      try {
        const origin = new URL(req.url).origin;

        await fetch(`${origin}/api/notifications/kakao`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            template_code: "event_entry_user",
            to: phone,
            variables: {
              name: name ?? existing.name ?? "참가자",
              entry_code: recoveredEntryCode,
            },
          }),
        });
      } catch (notifyError) {
        console.error("Dummy kakao notify failed:", notifyError);
      }

      return NextResponse.json({
        ok: true,
        duplicated: true,
        entry: recovered,
      });
    }

    // 4) 신규 row 생성 -> identity(entry_no) 받기
    const { data: inserted, error: insertError } = await supabase
      .from("event_entries")
      .insert({
        name,
        phone,
      })
      .select("id, name, phone, entry_no, entry_code, created_at")
      .single();

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 500 }
      );
    }

    if (!inserted?.id) {
      return NextResponse.json(
        { ok: false, error: "inserted row id was not returned." },
        { status: 500 }
      );
    }

    const entryNo = inserted.entry_no;
    if (!entryNo) {
      return NextResponse.json(
        { ok: false, error: "entry_no was not generated." },
        { status: 500 }
      );
    }

    const entryCode = formatEntryCode(entryNo);

    const { data: updated, error: updateError } = await supabase
      .from("event_entries")
      .update({
        entry_code: entryCode,
      })
      .eq("id", inserted.id)
      .select("id, name, phone, entry_no, entry_code, created_at")
      .single();

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 }
      );
    }

    // 5) 더미 카카오 알림 호출
    try {
      const origin = new URL(req.url).origin;

      await fetch(`${origin}/api/notifications/kakao`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          template_code: "event_entry_user",
          to: phone,
          variables: {
            name: name ?? "참가자",
            entry_code: entryCode,
          },
        }),
      });
    } catch (notifyError) {
      console.error("Dummy kakao notify failed:", notifyError);
    }

    return NextResponse.json({
      ok: true,
      duplicated: false,
      entry: updated,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "event entry failed" },
      { status: 500 }
    );
  }
}