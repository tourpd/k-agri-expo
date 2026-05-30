import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: unknown) {
  return String(v || "").trim();
}

function num(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeCategory(v: unknown) {
  const s = clean(v);
  return s || "기타";
}

function normalizeGroup(v: unknown) {
  const s = clean(v);
  if (s === "big") return "big";
  return "general";
}

function normalizeDrawType(v: unknown) {
  const s = clean(v);
  if (s === "phone") return "phone";
  return "box";
}

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("live_prizes")
      .select("*")
      .is("deleted_at", null)
      .order("display_group", { ascending: true })
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, items: data || [] });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createSupabaseAdminClient();

    const drawType = normalizeDrawType(body.draw_type);
    const displayGroup = drawType === "phone" ? "big" : normalizeGroup(body.display_group);

    const payload = {
      title: clean(body.title),
      sponsor: clean(body.sponsor),
      description: clean(body.description),
      image_url: clean(body.image_url),
      quantity: num(body.quantity, 1),
      draw_type: drawType,
      display_group: displayGroup,
      category: normalizeCategory(body.category),
      sort_order: num(body.sort_order, 0),
      is_active: body.is_active !== false,
      vendor_delivery_required: body.vendor_delivery_required !== false,
      preview_note: clean(body.preview_note),
    };

    if (!payload.title) {
      return NextResponse.json(
        { ok: false, error: "경품명을 입력해주세요." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("live_prizes")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, prize: data });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const id = clean(body.id);

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "경품 ID가 없습니다." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const drawType = normalizeDrawType(body.draw_type);
    const displayGroup = drawType === "phone" ? "big" : normalizeGroup(body.display_group);

    const payload = {
      title: clean(body.title),
      sponsor: clean(body.sponsor),
      description: clean(body.description),
      image_url: clean(body.image_url),
      quantity: num(body.quantity, 1),
      draw_type: drawType,
      display_group: displayGroup,
      category: normalizeCategory(body.category),
      sort_order: num(body.sort_order, 0),
      is_active: body.is_active !== false,
      vendor_delivery_required: body.vendor_delivery_required !== false,
      preview_note: clean(body.preview_note),
    };

    if (!payload.title) {
      return NextResponse.json(
        { ok: false, error: "경품명을 입력해주세요." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("live_prizes")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, prize: data });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const id = clean(body.id);

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "삭제할 경품 ID가 없습니다." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { count, error: countError } = await supabase
      .from("live_winners")
      .select("id", { count: "exact", head: true })
      .eq("prize_id", id);

    if (countError) {
      return NextResponse.json({ ok: false, error: countError.message }, { status: 500 });
    }

    if ((count || 0) > 0) {
      const { error } = await supabase
        .from("live_prizes")
        .update({
          is_active: false,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        mode: "soft_delete",
        message: "이미 당첨 기록이 있어 숨김 처리했습니다.",
      });
    }

    const { error } = await supabase.from("live_prizes").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      mode: "hard_delete",
      message: "경품이 삭제되었습니다.",
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "server error" },
      { status: 500 }
    );
  }
}